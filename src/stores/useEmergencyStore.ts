import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import {
  DeliveryState,
  FailSafeTier,
  GeoCoordinates,
  MediaWorkflowState,
  UserProfileMode,
} from '../types';
import { useAppStore } from './useAppStore';

const IDLE_DELIVERY: DeliveryState = { cloud: 'idle', sms: 'idle', ble: 'idle' };

interface EmergencyState {
  isEmergencyActive: boolean;
  /** Full uuid v4; also the primary key of the row in public.incidents_public. */
  activeIncidentId: string | null;
  /** Short display form of the incident id for the console header. */
  activeAlertId: string | null;
  triggerReason: string | null;
  triggerMode: UserProfileMode | null;
  activeTier: FailSafeTier;
  isStealthMode: boolean;
  isSirenRinging: boolean;
  mediaStatus: MediaWorkflowState;
  recordedAudioUri: string | null;
  capturedPhotoUri: string | null;
  /** Family live-alert link for the active incident (null if web URL not configured). */
  familyLink: string | null;
  delivery: DeliveryState;
  /**
   * Last known position. Zeros with hasLocationFix=false mean "no GPS fix yet":
   * consumers must check hasLocationFix and never display or transmit 0,0.
   */
  coordinates: GeoCoordinates;
  hasLocationFix: boolean;
  trappedCount: number;
  triggerEmergency: (reason?: string) => string;
  resolveEmergency: () => void;
  setActiveTier: (tier: FailSafeTier) => void;
  setStealthMode: (active: boolean) => void;
  setSirenRinging: (ringing: boolean) => void;
  setMediaStatus: (status: MediaWorkflowState) => void;
  setRecordedAudioUri: (uri: string | null) => void;
  setCapturedPhotoUri: (uri: string | null) => void;
  setFamilyLink: (link: string | null) => void;
  setDelivery: (patch: Partial<DeliveryState>) => void;
  updateCoordinates: (coords: GeoCoordinates) => void;
  setTrappedCount: (count: number) => void;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  isEmergencyActive: false,
  activeIncidentId: null,
  activeAlertId: null,
  triggerReason: null,
  triggerMode: null,
  activeTier: 'idle',
  isStealthMode: false,
  isSirenRinging: false,
  mediaStatus: 'idle',
  recordedAudioUri: null,
  capturedPhotoUri: null,
  familyLink: null,
  delivery: IDLE_DELIVERY,
  trappedCount: 1,
  hasLocationFix: false,
  coordinates: {
    latitude: 0,
    longitude: 0,
    altitude: null,
    accuracy: null,
    timestamp: 0,
  },

  triggerEmergency: (reason) => {
    // Re-triggering while active keeps the existing incident (no duplicate rows).
    const existing = get().activeIncidentId;
    if (get().isEmergencyActive && existing) return existing;

    const incidentId = Crypto.randomUUID();
    set({
      isEmergencyActive: true,
      activeIncidentId: incidentId,
      activeAlertId: incidentId.slice(0, 8).toUpperCase(),
      triggerReason: reason ?? null,
      triggerMode: useAppStore.getState().activeProfile,
      activeTier: 'tier1_internet',
      mediaStatus: 'idle',
      familyLink: null,
      delivery: { cloud: 'pending', sms: 'idle', ble: 'idle' },
    });
    return incidentId;
  },

  resolveEmergency: () => {
    set({
      isEmergencyActive: false,
      activeIncidentId: null,
      activeAlertId: null,
      triggerReason: null,
      triggerMode: null,
      activeTier: 'idle',
      isSirenRinging: false,
      mediaStatus: 'idle',
      recordedAudioUri: null,
      capturedPhotoUri: null,
      familyLink: null,
      delivery: IDLE_DELIVERY,
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
  setFamilyLink: (link) => set({ familyLink: link }),
  setDelivery: (patch) => set((state) => ({ delivery: { ...state.delivery, ...patch } })),
  updateCoordinates: (coords) => set({ coordinates: coords, hasLocationFix: true }),
  setTrappedCount: (count) => set({ trappedCount: count }),
}));
