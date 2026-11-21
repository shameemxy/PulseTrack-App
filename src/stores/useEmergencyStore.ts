import { create } from 'zustand';
import { FailSafeTier, MediaWorkflowState, GeoCoordinates } from '../types';
import { useAppStore } from './useAppStore';

interface EmergencyState {
  isEmergencyActive: boolean;
  activeAlertId: string | null;
  activeTier: FailSafeTier;
  isStealthMode: boolean;
  isSirenRinging: boolean;
  mediaStatus: MediaWorkflowState;
  recordedAudioUri: string | null;
  capturedPhotoUri: string | null;
  coordinates: GeoCoordinates;
  trappedCount: number;
  triggerEmergency: (reason?: string) => void;
  resolveEmergency: () => void;
  setActiveTier: (tier: FailSafeTier) => void;
  setStealthMode: (active: boolean) => void;
  setSirenRinging: (ringing: boolean) => void;
  setMediaStatus: (status: MediaWorkflowState) => void;
  setRecordedAudioUri: (uri: string | null) => void;
  setCapturedPhotoUri: (uri: string | null) => void;
  updateCoordinates: (coords: GeoCoordinates) => void;
  setTrappedCount: (count: number) => void;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  isEmergencyActive: false,
  activeAlertId: null,
  activeTier: 'idle',
  isStealthMode: false,
  isSirenRinging: false,
  mediaStatus: 'idle',
  recordedAudioUri: null,
  capturedPhotoUri: null,
  trappedCount: 1,
  coordinates: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 15,
    accuracy: 5,
    timestamp: Date.now(),
  },

  triggerEmergency: (reason) => {
    const alertId = `ALERT-${Date.now().toString(36).toUpperCase()}`;
    set({
      isEmergencyActive: true,
      activeAlertId: alertId,
      activeTier: 'tier1_internet',
      mediaStatus: 'idle',
    });
  },

  resolveEmergency: () => {
    set({
      isEmergencyActive: false,
      activeAlertId: null,
      activeTier: 'idle',
      isSirenRinging: false,
      mediaStatus: 'idle',
      recordedAudioUri: null,
      capturedPhotoUri: null,
    });
  },

  setActiveTier: (tier) => set({ activeTier: tier }),

  setStealthMode: (active) => {
    set({ isStealthMode: active });
    if (active) {
      // Force OLED Theme and permanently mute sirens for stealth
      useAppStore.getState().setTheme('oled');
      set({ isSirenRinging: false });
    }
  },

  setSirenRinging: (ringing) => {
    // Cannot ring if stealth mode is active
    if (get().isStealthMode && ringing) return;
    set({ isSirenRinging: ringing });
  },

  setMediaStatus: (status) => set({ mediaStatus: status }),
  setRecordedAudioUri: (uri) => set({ recordedAudioUri: uri }),
  setCapturedPhotoUri: (uri) => set({ capturedPhotoUri: uri }),
  updateCoordinates: (coords) => set({ coordinates: coords }),
  setTrappedCount: (count) => set({ trappedCount: count }),
}));
