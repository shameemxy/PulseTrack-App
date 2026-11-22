# PulseTrack Phase 1B: Onboarding

Unzip over the project root (paths are project-relative). 9 files, all complete replacements or new files.

New:
- src/theme/emergency.ts
- src/components/common/BrandSplash.tsx
- src/components/onboarding/OnboardingUI.tsx
- src/screens/onboarding/BriefingScreen.tsx
- src/screens/onboarding/ProfileScreen.tsx
- src/screens/onboarding/ContactsScreen.tsx
- src/screens/onboarding/PermissionsScreen.tsx

Replaced:
- src/navigation/RootNavigator.tsx
- App.tsx

No new npm dependencies (expo-camera, expo-location, expo-notifications, expo-audio are already installed).

## Verify (PowerShell, project root)

    npx tsc --noEmit
    npx expo start -c

Expected: App.tsx and every Phase 1B file type-check clean. Remaining tsc errors are in legacy files
(HomeScreen, tier1/2/3, ZoneMap) that Phase 2 and later replace.

## Manual checks

1. Cold start: black screen, ring and wordmark fade in, about 1.2 s, then Briefing.
2. Permissions step lists Location, Microphone, Camera, Notifications, each with a live status badge.
3. Tap Allow on Camera; the badge flips to Granted. Deny twice; the button becomes Settings.
4. Profile and Contacts: focus a field on iPhone; footer stays above the keyboard.
5. Android dev client: focus Contacts phone field and confirm the footer button is not hidden by
   the keyboard (Android uses no KeyboardAvoidingView behavior by design here).
