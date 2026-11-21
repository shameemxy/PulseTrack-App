import { splitWriteIncident } from './supabase';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useAppStore } from '../stores/useAppStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { triggerTier2SmsFallback } from './tier2_sms';

const TIER_1_TIMEOUT_MS = 4000;

export async function executeTier1Alert(): Promise<boolean> {
  const emergencyStore = useEmergencyStore.getState();
  const appStore = useAppStore.getState();
  const telemetryStore = useTelemetryStore.getState();

  const { coordinates, trappedCount, recordedAudioUri, capturedPhotoUri } = emergencyStore;
  const { userProfile } = appStore;
  const { batteryLevel } = telemetryStore;

  emergencyStore.setActiveTier('tier1_internet');

  const publicPayload = {
    user_id: null,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    altitude: coordinates.altitude || 0,
    battery_pct: batteryLevel,
    status: 'active' as const,
    transmission_tier: 'tier1_internet' as const,
    trapped_count: trappedCount,
  };

  const privatePayload = {
    user_id: null,
    victim_name: userProfile.fullName,
    ice_contact_phone: userProfile.iceContactPhone,
    medical_notes: `${userProfile.bloodType} | ${userProfile.emergencyNotes}`,
    audio_recording_url: recordedAudioUri,
    photo_evidence_url: capturedPhotoUri,
  };

  // Promise with race timeout for instant fail-safe degradation
  const writePromise = splitWriteIncident(publicPayload, privatePayload);
  const timeoutPromise = new Promise<{ success: boolean; error: string }>((resolve) =>
    setTimeout(() => resolve({ success: false, error: 'TIMEOUT_TIER_1' }), TIER_1_TIMEOUT_MS)
  );

  const result = await Promise.race([writePromise, timeoutPromise]);

  if (result.success) {
    return true;
  }

  // Tier 1 Failed or Timed Out -> Immediately trigger Tier 2 SMS
  console.warn('[PulseTrack] Tier 1 failed or timed out. Triggering Tier 2 SMS Fallback...');
  return triggerTier2SmsFallback();
}
