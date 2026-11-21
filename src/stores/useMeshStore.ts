import { create } from 'zustand';
import { TrappedNodePayload, ZonePolygon } from '../types';

interface MeshState {
  isRelayActive: boolean;
  discoveredTrappedNodes: Record<string, TrappedNodePayload>;
  relayedPacketsCount: number;
  dangerZones: ZonePolygon[];
  safeZones: ZonePolygon[];
  setRelayActive: (active: boolean) => void;
  addOrUpdateTrappedNode: (node: TrappedNodePayload) => void;
  incrementRelayedCount: () => void;
  clearNodes: () => void;
}

export const useMeshStore = create<MeshState>((set) => ({
  isRelayActive: true,
  discoveredTrappedNodes: {
    'BLE-NODE-A49': {
      nodeId: 'BLE-NODE-A49',
      victimName: 'Maya Lin',
      latitude: 37.7758,
      longitude: -122.4178,
      batteryPct: 34,
      timestamp: Date.now() - 1000 * 60 * 4,
      rssi: -64,
      hops: 1,
    },
    'BLE-NODE-C82': {
      nodeId: 'BLE-NODE-C82',
      victimName: 'David Chen',
      latitude: 37.7735,
      longitude: -122.4212,
      batteryPct: 18,
      timestamp: Date.now() - 1000 * 60 * 12,
      rssi: -82,
      hops: 2,
    },
  },
  relayedPacketsCount: 14,
  dangerZones: [
    {
      id: 'dz-1',
      type: 'danger',
      title: 'Gas Leak & Structural Instability',
      description: 'Collapsed parking structure with active methane plume.',
      coordinates: [
        { latitude: 37.7765, longitude: -122.418 },
        { latitude: 37.7775, longitude: -122.417 },
        { latitude: 37.7768, longitude: -122.416 },
        { latitude: 37.7755, longitude: -122.417 },
      ],
      radiusMeters: 250,
    },
  ],
  safeZones: [
    {
      id: 'sz-1',
      type: 'safe',
      title: 'Civic Center Assembly & Field Hospital',
      description: 'Red Cross field station, potable water, medical triage unit.',
      coordinates: [
        { latitude: 37.779, longitude: -122.4185 },
        { latitude: 37.7802, longitude: -122.417 },
        { latitude: 37.7795, longitude: -122.415 },
      ],
      radiusMeters: 400,
    },
  ],

  setRelayActive: (active) => set({ isRelayActive: active }),

  addOrUpdateTrappedNode: (node) =>
    set((state) => ({
      discoveredTrappedNodes: {
        ...state.discoveredTrappedNodes,
        [node.nodeId]: node,
      },
    })),

  incrementRelayedCount: () =>
    set((state) => ({ relayedPacketsCount: state.relayedPacketsCount + 1 })),

  clearNodes: () => set({ discoveredTrappedNodes: {} }),
}));
