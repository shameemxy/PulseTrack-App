import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/stores/useAppStore';
import { useProfileStore } from './src/stores/useProfileStore';
import { telemetryService } from './src/services/telemetry';
import { bleMeshService } from './src/services/tier3_ble_mesh';
import { startOutboxWatcher } from './src/services/outbox';
import { syncProfileIfNeeded } from './src/services/profileSync';

const PROFILE_SYNC_RETRY_MS = 60_000;

export default function App() {
  const theme = useAppStore((state) => state.theme);
  const isBackgroundMonitoring = useAppStore((state) => state.isBackgroundMonitoring);
  const onboardingCompleted = useProfileStore((state) => state.onboardingCompleted);
  const profileRevision = useProfileStore((state) => state.profileRevision);
  const profileHydrated = useProfileStore((state) => state.hasHydrated);

  // Durable offline outbox: retries on reconnect, on foreground and every 30 s.
  useEffect(() => startOutboxWatcher(), []);

  // Push profile/contact edits to Supabase. Local storage stays the source of truth.
  useEffect(() => {
    if (!profileHydrated) return;
    void syncProfileIfNeeded();
    const interval = setInterval(() => {
      void syncProfileIfNeeded();
    }, PROFILE_SYNC_RETRY_MS);
    return () => clearInterval(interval);
  }, [profileHydrated, profileRevision]);

  // Sensors start only after onboarding, so permission prompts come from the
  // Permissions step and never fire at first launch.
  useEffect(() => {
    if (!onboardingCompleted || !isBackgroundMonitoring) return;
    void telemetryService.start();
    bleMeshService.startScanning();
    return () => {
      telemetryService.stop();
      bleMeshService.stopScanning();
    };
  }, [onboardingCompleted, isBackgroundMonitoring]);

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
