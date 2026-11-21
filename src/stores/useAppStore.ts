import { create } from 'zustand';
import { UserProfileMode, AppThemeMode, UserProfile } from '../types';

interface AppState {
  theme: AppThemeMode;
  activeProfile: UserProfileMode;
  userProfile: UserProfile;
  isBackgroundMonitoring: boolean;
  setTheme: (theme: AppThemeMode) => void;
  setActiveProfile: (profile: UserProfileMode) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  setMonitoringActive: (active: boolean) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  activeProfile: 'default',
  isBackgroundMonitoring: true,
  userProfile: {
    id: 'user-pulse-01',
    fullName: 'Alex Mercer',
    bloodType: 'O+',
    iceContactPhone: '+1-555-0199',
    emergencyNotes: 'No known drug allergies. Asthmatic.',
    groupName: 'Bravo-Squad',
  },
  setTheme: (theme) => set({ theme }),
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  setUserProfile: (profile) =>
    set((state) => ({ userProfile: { ...state.userProfile, ...profile } })),
  setMonitoringActive: (active) => set({ isBackgroundMonitoring: active }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : state.theme === 'light' ? 'oled' : 'dark',
    })),
}));
