import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncidentPublic, IncidentPrivate, TriagePriority } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    // Zero-Cost Graceful degradation: auto disconnect when offline
    params: {
      eventsPerSecond: 2,
    },
  },
});

/**
 * Split Write: Dispatch public telemetry (anonymized) and private incident records.
 * Uses REST fallback if Realtime socket drops.
 */
export async function splitWriteIncident(
  publicPayload: Omit<IncidentPublic, 'id' | 'created_at' | 'updated_at' | 'claim_version'>,
  privatePayload: Omit<IncidentPrivate, 'id' | 'incident_id' | 'created_at'>
): Promise<{ success: boolean; incidentId?: string; error?: string }> {
  try {
    // 1. Write to incidents_public
    const { data: pubData, error: pubError } = await supabase
      .from('incidents_public')
      .insert({
        ...publicPayload,
        claim_version: 0,
      })
      .select('id')
      .single();

    if (pubError || !pubData) {
      throw new Error(`Public incident write failed: ${pubError?.message || 'Unknown'}`);
    }

    const incidentId = pubData.id;

    // 2. Write to incidents_private
    const { error: privError } = await supabase
      .from('incidents_private')
      .insert({
        ...privatePayload,
        incident_id: incidentId,
      });

    if (privError) {
      console.warn('Private incident write warning:', privError.message);
      // Incident was still registered publicly (Nothing Fails principle)
    }

    return { success: true, incidentId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Supabase connection failure' };
  }
}

/**
 * Optimistic Locking RPC Caller for Gemini AI Triage
 * Prevents race conditions during concurrent triage processing in the command center.
 */
export async function claimAndTriageIncident(
  incidentId: string,
  currentVersion: number,
  aiWorkerId: string,
  aiSummary: string,
  priority: TriagePriority
): Promise<{ success: boolean; newVersion?: number; code?: string; message?: string }> {
  try {
    const { data, error } = await supabase.rpc('claim_and_triage_incident', {
      p_incident_id: incidentId,
      p_current_version: currentVersion,
      p_ai_worker_id: aiWorkerId,
      p_ai_summary: aiSummary,
      p_priority: priority,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data as { success: boolean; newVersion?: number; code?: string; message?: string };
  } catch (err: any) {
    return { success: false, message: err.message || 'RPC invocation failed' };
  }
}
