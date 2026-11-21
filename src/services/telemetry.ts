import { Accelerometer } from 'expo-sensors';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useAppStore } from '../stores/useAppStore';

class TelemetryService {
  private accelSubscription: any = null;
  private batteryInterval: any = null;
  private locationSubscription: any = null;
  private isRunning: boolean = false;

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Accelerometer Listener
    Accelerometer.setUpdateInterval(200); // 5Hz polling for battery efficiency
    this.accelSubscription = Accelerometer.addListener((data) => {
      // Vector magnitude in Gs: sqrt(x^2 + y^2 + z^2)
      const magnitudeG = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);

      // Noise simulation / dB calculation: between 38dB (whisper) and 95dB (ambient)
      const simulatedNoiseDb = 40 + Math.random() * 8 + (magnitudeG > 2.0 ? 35 : 0);

      useTelemetryStore.getState().setTelemetryData({
        impactG: magnitudeG,
        noiseDb: simulatedNoiseDb,
      });

      // Sensitivity tuning based on active profile mode
      const activeMode = useAppStore.getState().activeProfile;
      const { impactThresholdG, noiseThresholdDb } = useTelemetryStore.getState();

      const multiplier =
        activeMode === 'disaster' ? 0.7 : activeMode === 'travel_solo' ? 0.85 : 1.0;

      if (magnitudeG >= impactThresholdG * multiplier) {
        console.warn(`[PulseTrack Telemetry] Impact Trigger Threshold Exceeded: ${magnitudeG.toFixed(2)}G`);
        // Trigger auto-emergency if not already active
        const { isEmergencyActive, triggerEmergency } = useEmergencyStore.getState();
        if (!isEmergencyActive && activeMode !== 'default') {
          triggerEmergency('SEEK_SHELTER_IMPACT_DETECTED');
        }
      }
    });

    // 2. Battery Monitoring
    try {
      const initialBattery = await Battery.getBatteryLevelAsync();
      if (initialBattery !== -1) {
        useTelemetryStore.getState().setTelemetryData({
          batteryLevel: Math.round(initialBattery * 100),
        });
      }
      this.batteryInterval = setInterval(async () => {
        const level = await Battery.getBatteryLevelAsync();
        if (level !== -1) {
          useTelemetryStore.getState().setTelemetryData({
            batteryLevel: Math.round(level * 100),
          });
        }
      }, 30000);
    } catch (e) {
      console.warn('[PulseTrack Telemetry] Battery sensor check bypassed.');
    }

    // 3. Location Tracking
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        useEmergencyStore.getState().updateCoordinates({
          latitude: initialLoc.coords.latitude,
          longitude: initialLoc.coords.longitude,
          altitude: initialLoc.coords.altitude,
          accuracy: initialLoc.coords.accuracy,
          timestamp: initialLoc.timestamp,
        });

        this.locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            useEmergencyStore.getState().updateCoordinates({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              altitude: loc.coords.altitude,
              accuracy: loc.coords.accuracy,
              timestamp: loc.timestamp,
            });
          }
        );
      }
    } catch (e) {
      console.warn('[PulseTrack Telemetry] Location sensor bypassed.');
    }
  }

  public stop(): void {
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
    }
    if (this.batteryInterval) {
      clearInterval(this.batteryInterval);
      this.batteryInterval = null;
    }
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isRunning = false;
  }
}

export const telemetryService = new TelemetryService();
