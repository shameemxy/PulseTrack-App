# =============================================================================
# PulseTrack Phase 1A runbook (PowerShell, Windows).  Run from the project root:
#   cd C:\Users\victus\Projects\PulseTrackApp
# Run the sections one at a time and read the output of each.
# =============================================================================

# --- 0. Confirm location and clean git state ---------------------------------
Get-Location
git status --short

# --- 1. Back up the files this phase replaces --------------------------------
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path ".backup\$stamp" | Out-Null
foreach ($f in @("app.json","eas.json","src\services\supabase.ts","src\types\index.ts",
                 "src\stores\useAppStore.ts","src\stores\useEmergencyStore.ts",
                 "src\stores\useMeshStore.ts","src\stores\useTelemetryStore.ts")) {
  if (Test-Path $f) {
    New-Item -ItemType Directory -Force -Path (Split-Path ".backup\$stamp\$f") | Out-Null
    Copy-Item $f ".backup\$stamp\$f"
  }
}
if (-not (Select-String -Path .gitignore -Pattern "^\.backup" -Quiet)) { Add-Content .gitignore "`n.backup/" }

# --- 2. Copy the Phase 1A files over (from wherever you saved the download) --
# Example, if the download is extracted to C:\Users\victus\Downloads\phase1a :
# Copy-Item -Recurse -Force C:\Users\victus\Downloads\phase1a\* .
# Do NOT copy over your existing .env. Only .env.example is new.

# --- 3. Install dependencies with Expo's SDK 57 resolver ---------------------
npx expo install @supabase/supabase-js react-native-url-polyfill zustand `
  @react-native-async-storage/async-storage @react-native-community/netinfo `
  expo-crypto expo-battery expo-location expo-camera expo-audio expo-notifications `
  expo-sms react-native-ble-plx

# Remove the packages the new architecture no longer uses
# (safe to skip if they are not installed):
# npm uninstall expo-av

# --- 4. Fix the env gap: create or update .env --------------------------------
# .env needs these four keys. Edit it in VS Code; never paste values into chat.
#   EXPO_PUBLIC_SUPABASE_URL=https://uchskguarketvgzapvsb.supabase.co
#   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from Supabase Dashboard > Project Settings > API>
#   EXPO_PUBLIC_WEB_BASE_URL=https://pulsetrack.example.invalid
#   EXPO_PUBLIC_EMERGENCY_DISPATCH_PHONE=112
Select-String -Path .env -Pattern "^EXPO_PUBLIC_[A-Z_]+=" | ForEach-Object { ($_.Line -split "=")[0] }

# --- 5. EAS: push the same env values to the cloud build ---------------------
# Without this the Android .apk is built with EMPTY keys and Tier 1 fails there.
# "plaintext" is acceptable for EXPO_PUBLIC_* because they ship inside the app anyway.
eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_URL --visibility plaintext
eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --visibility plaintext
eas env:create --environment development --name EXPO_PUBLIC_WEB_BASE_URL --visibility plaintext
eas env:create --environment development --name EXPO_PUBLIC_EMERGENCY_DISPATCH_PHONE --visibility plaintext
# Repeat with --environment preview and --environment production before those builds.
eas env:list --environment development

# --- 6. Typecheck (Phase 1A files only touch stores/services/config/types) ----
npx tsc --noEmit
# Expect errors ONLY from old screens/components that still import removed
# store fields (userName, userPhone, MediaStateMachine, etc.). Phase 1B
# replaces those. Errors inside src\stores, src\services, src\config or
# src\types mean a Phase 1A bug: send them to me.

# --- 7. Expo Go smoke test ----------------------------------------------------
npx expo start --clear
