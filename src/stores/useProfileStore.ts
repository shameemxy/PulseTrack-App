import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { BloodGroup, EmergencyContact } from '../types';

export const MAX_CONTACTS = 5;
export const NAME_NOT_PROVIDED = 'Name not provided';

/** Strips spaces, dashes and brackets. Result must be 5-15 digits, optional leading +. */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, '');
  return /^\+?[0-9]{5,15}$/.test(cleaned) ? cleaned : null;
}

export type ContactInput = { name: string; relationship: string; phone: string };
export type ContactResult = { ok: true; contact: EmergencyContact } | { ok: false; error: string };

interface ProfileState {
  fullName: string;
  bloodGroup: BloodGroup | null;
  medicalNotes: string;
  contacts: EmergencyContact[];

  onboardingCompleted: boolean;
  briefingSeen: boolean;

  /** Bumped on every user edit; the outbox syncs when revision > syncedRevision. */
  profileRevision: number;
  syncedRevision: number;
  hasHydrated: boolean;

  setProfile: (patch: Partial<Pick<ProfileState, 'fullName' | 'bloodGroup' | 'medicalNotes'>>) => void;
  addContact: (input: ContactInput) => ContactResult;
  updateContact: (id: string, input: ContactInput) => ContactResult;
  removeContact: (id: string) => void;
  completeOnboarding: () => void;
  setBriefingSeen: () => void;
  markSynced: (revision: number) => void;
  setHasHydrated: (value: boolean) => void;
}

function validateContact(input: ContactInput): { ok: true; value: ContactInput } | { ok: false; error: string } {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 80) {
    return { ok: false, error: 'Enter the contact name (up to 80 characters).' };
  }
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: 'Enter a valid phone number, 5 to 15 digits. Include the country code with a leading +.' };
  }
  const relationship = input.relationship.trim().slice(0, 40);
  return { ok: true, value: { name, relationship, phone } };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      fullName: '',
      bloodGroup: null,
      medicalNotes: '',
      contacts: [],
      onboardingCompleted: false,
      briefingSeen: false,
      profileRevision: 0,
      syncedRevision: 0,
      hasHydrated: false,

      setProfile: (patch) =>
        set((state) => ({
          ...patch,
          fullName: (patch.fullName ?? state.fullName).slice(0, 80),
          medicalNotes: (patch.medicalNotes ?? state.medicalNotes).slice(0, 500),
          profileRevision: state.profileRevision + 1,
        })),

      addContact: (input) => {
        if (get().contacts.length >= MAX_CONTACTS) {
          return { ok: false, error: `You can save up to ${MAX_CONTACTS} emergency contacts.` };
        }
        const checked = validateContact(input);
        if (!checked.ok) return checked;
        if (get().contacts.some((c) => c.phone === checked.value.phone)) {
          return { ok: false, error: 'That phone number is already saved.' };
        }
        const contact: EmergencyContact = { id: Crypto.randomUUID(), ...checked.value };
        set((state) => ({
          contacts: [...state.contacts, contact],
          profileRevision: state.profileRevision + 1,
        }));
        return { ok: true, contact };
      },

      updateContact: (id, input) => {
        const existing = get().contacts.find((c) => c.id === id);
        if (!existing) return { ok: false, error: 'Contact no longer exists.' };
        const checked = validateContact(input);
        if (!checked.ok) return checked;
        if (get().contacts.some((c) => c.id !== id && c.phone === checked.value.phone)) {
          return { ok: false, error: 'That phone number is already saved.' };
        }
        const contact: EmergencyContact = { id, ...checked.value };
        set((state) => ({
          contacts: state.contacts.map((c) => (c.id === id ? contact : c)),
          profileRevision: state.profileRevision + 1,
        }));
        return { ok: true, contact };
      },

      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
          profileRevision: state.profileRevision + 1,
        })),

      completeOnboarding: () => set({ onboardingCompleted: true }),
      setBriefingSeen: () => set({ briefingSeen: true }),
      markSynced: (revision) =>
        set((state) => ({ syncedRevision: Math.max(state.syncedRevision, revision) })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'pulsetrack.profile.v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        fullName: state.fullName,
        bloodGroup: state.bloodGroup,
        medicalNotes: state.medicalNotes,
        contacts: state.contacts,
        onboardingCompleted: state.onboardingCompleted,
        briefingSeen: state.briefingSeen,
        profileRevision: state.profileRevision,
        syncedRevision: state.syncedRevision,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
