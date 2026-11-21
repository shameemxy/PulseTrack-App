# 🚀 HowToRun.md: Local Development & Expo Custom Dev Client Guide

This guide walks you through setting up, compiling, and running **PulseTrack** on physical hardware or emulators. 

> ⚠️ **IMPORTANT**: Because PulseTrack relies on low-level native hardware modules (`react-native-ble-plx`, `expo-av` background audio speaker overrides, and native SMS drivers), **it must be run using an Expo Custom Dev Client or direct native build (`expo run:android` / `expo run:ios`)**, not standard Expo Go.

---

## 1. System Requirements & Environment

| Dependency | Minimum Version | Recommended Version |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.x` | `v20.x LTS` |
| **npm / pnpm / yarn** | npm `>= 9.x` / pnpm `>= 8.x` | `pnpm` or `npm` |
| **Expo SDK** | `SDK 51.x` | `SDK 51.0.38` |
| **Java JDK (Android)** | JDK 17 | OpenJDK 17 (Azul Zulu 17) |
| **Android SDK** | API Level 34 | Android 14 (API 34) + Build Tools 34.0.0 |
| **Xcode (iOS)** | 15.0+ (macOS only) | Xcode 15.4+ with iOS 17 Simulator |

---

## 2. Installation & Setup

### Step 1: Install Dependencies
Open your terminal in the `PulseTrackApp` root:

```bash
# If using npm:
npm install --legacy-peer-deps

# If using pnpm:
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase project parameters:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_EMERGENCY_DISPATCH_PHONE=112
```

---

## 3. Generate Native Projects (Prebuild)

Run Expo Prebuild to generate the native `android/` and `ios/` folders configured with native BLE and SMS permissions:

```bash
npx expo prebuild --clean
```

---

## 4. Running the Application

### Option A: Run on Android (Physical Device Recommended for BLE & SMS)
Ensure an Android device with Developer Options & USB Debugging is connected (`adb devices` lists the device):

```bash
# Compile and install native debug build on connected Android device / emulator
npx expo run:android
```

### Option B: Run on iOS (macOS with Xcode)
```bash
# Compile and install on iOS simulator or device
npx expo run:ios
```

### Option C: Start Metro Bundler with Dev Client
If the native app is already installed on your phone:
```bash
npx expo start --dev-client
```

---

## 5. Simulating the 3-Tier Fail-Safe Scenarios

PulseTrack is engineered with the **"Nothing Fails"** guarantee. Test each tier:

### 🟢 Testing Tier 1 (Full Internet Available)
1. Ensure Wi-Fi or Cellular Data is enabled.
2. Tap and hold the **SOS Beacon** button for 2 seconds.
3. Observe the transmission status: `Tier 1: Cloud Synced (Supabase)`.
4. Check your Supabase table `incidents_public` to verify instantaneous row insertion.

### 🟡 Testing Tier 2 (No Data, Cellular Available - SMS Fallback)
1. Turn off Wi-Fi and disable Mobile Data (keep Cellular signal active).
2. Trigger the SOS Beacon.
3. PulseTrack detects that Supabase HTTP/WebSocket requests time out after 4 seconds.
4. The app automatically triggers **Tier 2 SMS Fallback**.
5. On Android, the background `SmsManager` delivers the compressed payload:
   ```
   SOS|19.0760,72.8777|89%|Alex Mercer
   ```
   to your configured ICE contact and `112`.

### 🔴 Testing Tier 3 (Total Grid Collapse - BLE Mesh Beacon)
1. Put the device in **Airplane Mode** (simulate total telecommunications grid collapse).
2. Turn **Bluetooth ON**.
3. Trigger the SOS Beacon or leave the device running in Disaster Mode.
4. The device initiates **Tier 3 BLE Mesh**:
   - The victim's phone advertises the compressed emergency packet over BLE Service UUID `0xFD6F`.
   - Take a second device running PulseTrack in **Safe Mode**.
   - The second device discovers the BLE packet and increments the **"Trapped Citizens Nearby"** counter on its dashboard, displaying the signal strength (RSSI) and estimated coordinates.

---

## 6. Common Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `BLE not supported in Expo Go` | Attempting to run via Expo Go | Run `npx expo run:android` to compile native code. |
| `Audio playback muted in Silent Mode` | iOS Audio Category not initialized | PulseTrack auto-configures `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })`. Ensure device volume is up. |
| `SmsManager permission denied` | Android 13+ dynamic permissions | Accept the `SEND_SMS` prompt when first launching the app. |
