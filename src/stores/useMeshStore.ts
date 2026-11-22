import { create } from 'zustand';
import { TrappedNodePayload, ZonePolygon } from '../types';

/**
 * Mesh state is populated only by real BLE discoveries (tier3_ble_mesh.ts) and,
 * later, by backend-published zones. It starts empty: the previous build shipped
 * invented victims ("Maya Lin", "David Chen") and invented San Francisco zones.
 */
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
  isRelayActive: false,
  discoveredTrappedNodes: {},
  relayedPacketsCount: 0,
  dangerZones: [],
  safeZones: [],

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
