import { create } from 'zustand';

interface TelemetryState {
  currentImpactG: number;
  currentNoiseDb: number;
  impactThresholdG: number;
  noiseThresholdDb: number;
  isThresholdLocked: boolean;
  batteryLevel: number;
  isImpactTriggered: boolean;
  isNoiseTriggered: boolean;
  setTelemetryData: (data: { impactG?: number; noiseDb?: number; batteryLevel?: number }) => void;
  setImpactThreshold: (threshold: number) => void;
  setNoiseThreshold: (threshold: number) => void;
  toggleThresholdLock: () => void;
  resetTriggers: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  currentImpactG: 1.0,
  currentNoiseDb: 42,
  impactThresholdG: 3.5, // 3.5G sudden shock/impact
  noiseThresholdDb: 88, // 88dB sudden collapse/explosion sound
  isThresholdLocked: true, // Locked by default to prevent pocket touches
  batteryLevel: 92,
  isImpactTriggered: false,
  isNoiseTriggered: false,

  setTelemetryData: (data) => {
    const state = get();
    const impactG = data.impactG !== undefined ? data.impactG : state.currentImpactG;
    const noiseDb = data.noiseDb !== undefined ? data.noiseDb : state.currentNoiseDb;
    const batteryLevel = data.batteryLevel !== undefined ? data.batteryLevel : state.batteryLevel;

    const isImpactTriggered = impactG >= state.impactThresholdG;
    const isNoiseTriggered = noiseDb >= state.noiseThresholdDb;

    set({
      currentImpactG: Number(impactG.toFixed(2)),
      currentNoiseDb: Math.round(noiseDb),
      batteryLevel,
      isImpactTriggered,
      isNoiseTriggered,
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
