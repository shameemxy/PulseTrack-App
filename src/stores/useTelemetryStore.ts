import { create } from 'zustand';

/**
 * Sensor readings. Battery and noise are null until a real reading exists.
 * Noise stays null until real microphone metering is implemented (Phase 3);
 * the previous build fabricated dB values from the accelerometer.
 */
interface TelemetryState {
  currentImpactG: number;
  currentNoiseDb: number | null;
  impactThresholdG: number;
  noiseThresholdDb: number;
  isThresholdLocked: boolean;
  batteryLevel: number | null;
  isImpactTriggered: boolean;
  isNoiseTriggered: boolean;
  setTelemetryData: (data: { impactG?: number; noiseDb?: number | null; batteryLevel?: number | null }) => void;
  setImpactThreshold: (threshold: number) => void;
  setNoiseThreshold: (threshold: number) => void;
  toggleThresholdLock: () => void;
  resetTriggers: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  currentImpactG: 1.0, // resting gravity until the first accelerometer sample
  currentNoiseDb: null,
  impactThresholdG: 3.5, // 3.5G sudden shock/impact
  noiseThresholdDb: 88, // 88dB sudden collapse/explosion sound
  isThresholdLocked: true, // Locked by default to prevent pocket touches
  batteryLevel: null,
  isImpactTriggered: false,
  isNoiseTriggered: false,

  setTelemetryData: (data) => {
    const state = get();
    const impactG = data.impactG !== undefined ? data.impactG : state.currentImpactG;
    const noiseDb = data.noiseDb !== undefined ? data.noiseDb : state.currentNoiseDb;
    const batteryLevel = data.batteryLevel !== undefined ? data.batteryLevel : state.batteryLevel;

    set({
      currentImpactG: Number(impactG.toFixed(2)),
      currentNoiseDb: noiseDb === null ? null : Math.round(noiseDb),
      batteryLevel,
      isImpactTriggered: impactG >= state.impactThresholdG,
      isNoiseTriggered: noiseDb !== null && noiseDb >= state.noiseThresholdDb,
    });
  },

  setImpactThreshold: (threshold) => {
    if (get().isThresholdLocked) return;
    set({ impactThresholdG: Number(threshold.toFixed(1)) });
  },

  setNoiseThreshold: (threshold) => {
    if (get().isThresholdLocked) return;
    set({ noiseThresholdDb: Math.round(threshold) });
  },

  toggleThresholdLock: () => {
    set((state) => ({ isThresholdLocked: !state.isThresholdLocked }));
  },

  resetTriggers: () => {
    set({ isImpactTriggered: false, isNoiseTriggered: false });
  },
}));
