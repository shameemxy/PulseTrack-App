import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient, type Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env, isBackendConfigured } from '../config/env';
import type {
  EmergencyContact,
  IncidentPrivate,
  IncidentPublic,
} from '../types';

/**
 * When the env keys are missing the client is still constructed (so imports
 * never crash Expo Go), but it points at a non-resolvable host and every
 * service goes through ensureSession(), which throws BackendNotConfiguredError
 * first. Nothing ever talks to a made-up project.
 */
const UNCONFIGURED_URL = 'https://unconfigured.invalid';

export const supabase = createClient(
  isBackendConfigured ? env.supabaseUrl : UNCONFIGURED_URL,
  isBackendConfigured ? env.supabasePublishableKey : 'unconfigured',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 2 } },
  }
);

if (isBackendConfigured) {
  // Refresh tokens only while the app is foregrounded (battery); ensureSession()
  // still refreshes on demand when an emergency fires from the background.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export class BackendNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    this.name = 'BackendNotConfiguredError';
  }
}

let pendingSignIn: Promise<Session> | null = null;

/**
 * Returns a valid session, creating an anonymous one on first use. The anonymous
 * user id is what owns this device's profile, contacts and incidents via RLS.
 * Requires "Allow anonymous sign-ins" to be enabled in the Supabase Dashboard.
 */
export async function ensureSession(): Promise<Session> {
  if (!isBackendConfigured) throw new BackendNotConfiguredError();

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  if (!pendingSignIn) {
    pendingSignIn = (async () => {
      const { data: signIn, error } = await supabase.auth.signInAnonymously();
      if (error || !signIn.session) {
        throw error ?? new Error('Anonymous sign-in returned no session');
      }
      return signIn.session;
    })().finally(() => {
      pendingSignIn = null;
    });
  }
  return pendingSignIn;
}

// ---------------------------------------------------------------------------
// Write results and error classification
// ---------------------------------------------------------------------------

export type WriteResult =
  | { kind: 'ok' }
  | { kind: 'retry'; message: string }
  | { kind: 'permanent'; message: string }
  | { kind: 'blocked'; message: string };

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

/** Postgres unique violation: the row is already stored (idempotent retry). */
const PG_UNIQUE_VIOLATION = '23505';

export function classifyError(err: ErrorLike, status?: number): WriteResult {
  const message = err.message ?? 'Unknown error';
  if (err instanceof BackendNotConfiguredError || err.name === 'BackendNotConfiguredError') {
    return { kind: 'blocked', message };
  }
  const http = status ?? err.status ?? 0;
  const looksLikeNetwork =
    http === 0 ||
    /network request failed|failed to fetch|network error|timeout|timed out|fetch/i.test(message) ||
    err.name === 'AuthRetryableFetchError';
  if (looksLikeNetwork) return { kind: 'retry', message };
  if (http === 401 || err.code === 'PGRST301' || /jwt/i.test(message)) {
    return { kind: 'retry', message };
  }
  if (http === 408 || http === 429 || http >= 500) return { kind: 'retry', message };
  return { kind: 'permanent', message: `${err.code ?? http}: ${message}` };
}

// ---------------------------------------------------------------------------
// Incident write (three idempotent inserts; the client supplies every id)
// ---------------------------------------------------------------------------

export type IncidentPublicInsert = Pick<
  IncidentPublic,
  | 'latitude'
  | 'longitude'
  | 'altitude'
  | 'accuracy'
  | 'battery_pct'
  | 'impact_g'
  | 'audio_db'
  | 'mode'
  | 'trigger_reason'
  | 'transmission_tier'
  | 'trapped_count'
>;

export type IncidentPrivateInsert = Pick<
  IncidentPrivate,
  'victim_name' | 'blood_group' | 'medical_notes' | 'ice_contacts'
>;

export interface FamilyLinkInsert {
  id: string;
  token_hash: string; // sha256 hex of the raw 64-char hex token
  expires_at: string; // ISO timestamp, max 7 days ahead (enforced by RLS)
}

export interface IncidentWriteJob {
  incidentId: string;
  publicRow: IncidentPublicInsert;
  privateRow: IncidentPrivateInsert;
  familyLinks: FamilyLinkInsert[];
}

export async function writeIncident(job: IncidentWriteJob): Promise<WriteResult> {
  try {
    const session = await ensureSession();
    const uid = session.user.id;

    const pub = await supabase
      .from('incidents_public')
      .insert({ id: job.incidentId, user_id: uid, ...job.publicRow });
    if (pub.error && pub.error.code !== PG_UNIQUE_VIOLATION) {
      return classifyError(pub.error, pub.status);
    }

    const priv = await supabase
      .from('incidents_private')
      .insert({ incident_id: job.incidentId, user_id: uid, ...job.privateRow });
    if (priv.error && priv.error.code !== PG_UNIQUE_VIOLATION) {
      return classifyError(priv.error, priv.status);
    }

    for (const link of job.familyLinks) {
      const res = await supabase.from('family_links').insert({
        id: link.id,
        incident_id: job.incidentId,
        user_id: uid,
        token_hash: link.token_hash,
        expires_at: link.expires_at,
      });
      if (res.error && res.error.code !== PG_UNIQUE_VIOLATION) {
        return classifyError(res.error, res.status);
      }
    }
    return { kind: 'ok' };
  } catch (err) {
    return classifyError(err as ErrorLike);
  }
}

export async function resolveIncidentRemote(incidentId: string): Promise<WriteResult> {
  try {
    await ensureSession();
    const { data, error, status } = await supabase.rpc('resolve_my_incident', {
      p_incident_id: incidentId,
    });
    if (error) return classifyError(error, status);
    const result = data as { success: boolean; code?: string } | null;
    // NOT_OPEN means it was already resolved or rescued: that is a success.
    if (result && (result.success || result.code === 'NOT_OPEN')) return { kind: 'ok' };
    return { kind: 'permanent', message: result?.code ?? 'resolve_my_incident failed' };
  } catch (err) {
    return classifyError(err as ErrorLike);
  }
}

// ---------------------------------------------------------------------------
// Profile + contacts sync
// ---------------------------------------------------------------------------

export interface ProfileSyncPayload {
  fullName: string;
  bloodGroup: string | null;
  medicalNotes: string | null;
  contacts: EmergencyContact[];
}

export async function syncProfileRemote(payload: ProfileSyncPayload): Promise<WriteResult> {
  try {
    const session = await ensureSession();
    const uid = session.user.id;

    const profileRes = await supabase.from('user_profiles').upsert(
      {
        user_id: uid,
        full_name: payload.fullName,
        blood_group: payload.bloodGroup,
        medical_notes: payload.medicalNotes,
      },
      { onConflict: 'user_id' }
    );
    if (profileRes.error) return classifyError(profileRes.error, profileRes.status);

    if (payload.contacts.length > 0) {
      const upsertRes = await supabase.from('emergency_contacts').upsert(
        payload.contacts.map((c) => ({
          id: c.id,
          user_id: uid,
          name: c.name,
          relationship: c.relationship || null,
          phone: c.phone,
        })),
        { onConflict: 'id' }
      );
      if (upsertRes.error) return classifyError(upsertRes.error, upsertRes.status);
    }

    // Remove contacts the user deleted locally.
    const keepIds = payload.contacts.map((c) => c.id);
    let del = supabase.from('emergency_contacts').delete().eq('user_id', uid);
    if (keepIds.length > 0) {
      del = del.not('id', 'in', `(${keepIds.join(',')})`);
    }
    const delRes = await del;
    if (delRes.error) return classifyError(delRes.error, delRes.status);

    return { kind: 'ok' };
  } catch (err) {
    return classifyError(err as ErrorLike);
  }
}
