import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/stores/useAppStore';
import { telemetryService } from './src/services/telemetry';
import { bleMeshService } from './src/services/tier3_ble_mesh';
import { supabase } from './src/services/supabase';

export default function App() {
  const theme = useAppStore((state) => state.theme);
  const isBackgroundMonitoring = useAppStore((state) => state.isBackgroundMonitoring);

  useEffect(() => {
    // 1. Initialize Background Telemetry (Accelerometer & Decibels)
    if (isBackgroundMonitoring) {
      telemetryService.start();
      bleMeshService.startScanning();
    }

    // 2. Realtime listener for incoming emergency broadcasts (Free-tier safe)
    const channel = supabase
      .channel('public:incidents_public')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents_public' },
        (payload) => {
          console.log('[PulseTrack Supabase Realtime] Incident logged:', payload.new);
        }
      )
      .subscribe();

    return () => {
      telemetryService.stop();
      bleMeshService.stopScanning();
      supabase.removeChannel(channel);
    };
  }, [isBackgroundMonitoring]);

  return (
    <SafeAreaProvider>
      <StatusBar
        style={theme === 'light' ? 'dark' : 'light'}
        backgroundColor={theme === 'oled' ? '#000000' : undefined}
      />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
