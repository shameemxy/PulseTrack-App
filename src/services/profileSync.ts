import { isBackendConfigured } from '../config/env';
import { useProfileStore } from '../stores/useProfileStore';
import { syncProfileRemote } from './supabase';

let syncing = false;

/**
 * Pushes the local profile and contacts to Supabase when they changed since the
 * last successful sync. Local AsyncStorage stays the source of truth, so an
 * emergency never depends on this call having succeeded.
 */
export async function syncProfileIfNeeded(): Promise<'synced' | 'skipped' | 'retry' | 'blocked'> {
  if (!isBackendConfigured) return 'blocked';
  const s = useProfileStore.getState();
  if (!s.hasHydrated || s.profileRevision <= s.syncedRevision) return 'skipped';
  if (syncing) return 'skipped';

  syncing = true;
  const revision = s.profileRevision;
  try {
    const result = await syncProfileRemote({
      fullName: s.fullName.trim(),
      bloodGroup: s.bloodGroup,
      medicalNotes: s.medicalNotes.trim() || null,
      contacts: s.contacts,
    });
    if (result.kind === 'ok') {
      useProfileStore.getState().markSynced(revision);
      return 'synced';
    }
    return result.kind === 'blocked' ? 'blocked' : 'retry';
  } finally {
    syncing = false;
  }
}
