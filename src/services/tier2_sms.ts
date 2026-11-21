import { Platform, NativeModules } from 'react-native';
import * as SMS from 'expo-sms';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useAppStore } from '../stores/useAppStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { triggerTier3BleMesh } from './tier3_ble_mesh';

/**
 * Compiles ultra-compressed SMS payload format:
 * SOS|Lat,Long|Battery%|Name
 * Example: SOS|37.7749,-122.4194|92%|Alex Mercer
 */
export function compileCompressedSmsPayload(): string {
  const { coordinates } = useEmergencyStore.getState();
  const { userProfile } = useAppStore.getState();
  const { batteryLevel } = useTelemetryStore.getState();

  const lat = coordinates.latitude.toFixed(4);
  const lng = coordinates.longitude.toFixed(4);
  const name = userProfile.fullName.trim() || 'Unknown Victim';

  return `SOS|${lat},${lng}|${batteryLevel}%|${name}`;
}

/**
 * Executes Tier 2 SMS broadcast.
 * Uses Android native SmsManager if available for background delivery without user prompt;
 * otherwise uses expo-sms fallback. If SMS fails, triggers Tier 3 BLE Mesh.
 */
export async function triggerTier2SmsFallback(): Promise<boolean> {
  const emergencyStore = useEmergencyStore.getState();
  const appStore = useAppStore.getState();

  emergencyStore.setActiveTier('tier2_sms');
  const payload = compileCompressedSmsPayload();
  const emergencyDispatch = process.env.EXPO_PUBLIC_EMERGENCY_DISPATCH_PHONE || '112';
  const iceContact = appStore.userProfile.iceContactPhone;

  const recipients = [emergencyDispatch, iceContact].filter(Boolean);

  try {
    // Check if Android Native SmsManager module is linked
    if (Platform.OS === 'android' && NativeModules.PulseTrackSmsManager?.sendDirectSms) {
      for (const phone of recipients) {
        await NativeModules.PulseTrackSmsManager.sendDirectSms(phone, payload);
      }
      return true;
    }

    // Expo SMS Fallback (iOS & dev clients without native module)
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync(recipients, payload);
      if (result === 'sent' || result === 'unknown') {
        return true;
      }
    }

    throw new Error('SMS service unavailable or delivery rejected');
  } catch (error) {
    console.warn('[PulseTrack] Tier 2 SMS delivery failed. Triggering Tier 3 BLE Mesh...', error);
    // Automatic fallback to Tier 3
    return triggerTier3BleMesh();
  }
}
