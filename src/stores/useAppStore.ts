import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfileMode, AppThemeMode } from '../types';

/**
 * App-level preferences only. Identity data (name, blood group, contacts) lives
 * in useProfileStore; the old hardcoded "Alex Mercer" profile is gone.
 *
 * activeProfile (operating mode) is intentionally NOT persisted: the user must
 * choose a mode on the Mode Selection Hub every launch (Phase 2 navigation).
 */
interface AppState {
  theme: AppThemeMode;
  activeProfile: UserProfileMode;
  isBackgroundMonitoring: boolean;
  hasHydrated: boolean;
  setTheme: (theme: AppThemeMode) => void;
  setActiveProfile: (profile: UserProfileMode) => void;
  setMonitoringActive: (active: boolean) => void;
  toggleTheme: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeProfile: 'default',
      isBackgroundMonitoring: true,
      hasHydrated: false,
      setTheme: (theme) => set({ theme }),
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      setMonitoringActive: (active) => set({ isBackgroundMonitoring: active }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : state.theme === 'light' ? 'oled' : 'dark',
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'pulsetrack.app.v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        isBackgroundMonitoring: state.isBackgroundMonitoring,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
