# 🗺️ PulseTrack: Architecture, Data Flow & System Mapping

## 1. Executive System Overview
PulseTrack is an ultra-resilient, zero-cost disaster management and emergency response mobile application developed for the **Code Tracers** team. Built under the engineering doctrine **"Nothing Fails"**, the system guarantees progressive degradation across three distinct communication tiers down to total telecommunications collapse.

---

## 2. Complete File & Directory Map

```
PulseTrackApp/
├── .env.example                          # Environment template for Supabase credentials
├── .gitignore                            # Standard React Native & Expo ignore rules
├── app.json                              # Expo config with native Android/iOS permission plugins
├── babel.config.js                       # Reanimated v3 & module resolver configuration
├── package.json                          # Complete production dependencies
├── tsconfig.json                         # Strict TypeScript settings & path aliases
├── metro.config.js                       # Metro bundler config for SVG/assets
│
├── Mapping.md                            # Comprehensive system architecture & mappings
├── PreDeploy.md                          # Supabase SQL, RLS, pg_cron, native AndroidManifest
├── HowToRun.md                           # Step-by-step local development & dev client launch
│
└── src/
    ├── types/
    │   └── index.ts                      # Strict types for Incidents, Tiers, Telemetry, Profiles
    │
    ├── theme/
    │   ├── colors.ts                     # High-contrast, Cyber Light, Dark & OLED Deep Black (#000000)
    │   ├── typography.ts                 # "Inter" font weight mappings & responsive scales
    │   └── glassmorphism.ts              # Translucent blur backdrops, glass borders, shadows
    │
    ├── data/
    │   └── survivalProtocols.json        # 100% offline disaster response encyclopedia
    │
    ├── stores/
    │   ├── useAppStore.ts                # App theme, Profile Mode (Default/Travel Solo/Group/Disaster)
    │   ├── useEmergencyStore.ts          # Active SOS state, fail-safe tier, stealth mode, media status
    │   ├── useTelemetryStore.ts          # Accelerometer, audio dB metering, lock thresholds
    │   └── useMeshStore.ts               # Nearby BLE trapped nodes, relay metrics, mesh packets
    │
    ├── services/
    │   ├── supabase.ts                   # Supabase client with Free-tier REST fallback & RPC calls
    │   ├── tier1_internet.ts             # Split-write Supabase telemetry + media dispatcher
    │   ├── tier2_sms.ts                  # Compressed payload generator & native/fallback SMS sender
    │   ├── tier3_ble_mesh.ts             # BLE advertising & scanning engine (react-native-ble-plx)
    │   ├── audioSiren.ts                 # 3000Hz SOS acoustic beacon with loudspeaker override
    │   ├── telemetry.ts                  # Continuous background sensors (Accelerometer + Mic dB)
    │   └── survivalGuideService.ts       # Fuse.js offline vector/fuzzy indexed search service
    │
    ├── components/
    │   ├── common/
    │   │   ├── BentoBox.tsx              # Modular bento container with glassmorphic styling
    │   │   ├── GlassCard.tsx             # Reusable blur card with high-contrast accessibility
    │   │   ├── ModeSelector.tsx          # Profile mode switcher without re-render stutter
    │   │   └── StatusBadge.tsx           # Status indicators (Online/SMS/BLE/Stealth)
    │   ├── emergency/
    │   │   ├── BigRedSOSButton.tsx       # Press-and-hold tactile SOS button with reanimated pulse
    │   │   ├── MediaStateMachine.tsx     # [Recording] -> [Uploading] -> [Sent] camera/mic widget
    │   │   ├── StealthToggle.tsx         # OLED Dark mute killswitch
    │   │   └── ThresholdSlider.tsx       # Impact & audio sensitivity slider with safety lock
    │   └── safe/
    │       ├── MeshRelayWidget.tsx       # Trapped citizens counter & relay transmission health
    │       ├── ZoneMap.tsx               # Danger & Safe zone visualization with interactive markers
    │       └── IntelCaptureModal.tsx     # Field situational intel submission for safe citizens
    │
    ├── screens/
    │   ├── HomeScreen.tsx                # Main Bento grid with mode toggle, quick SOS, quick tips
    │   ├── VictimDashboardScreen.tsx     # Active SOS console: live map, media pipeline, stealth, siren
    │   ├── SafeDashboardScreen.tsx       # Mesh relay manager, safe/danger map, intel capture, killswitch
    │   └── SurvivalGuideScreen.tsx       # Offline zero-network instant search encyclopedia
    │
    └── navigation/
        └── RootNavigator.tsx             # Navigation container, stack configuration & theme wrapper
```

---

## 3. Data Flow Diagrams: 3-Tier Fail-Safe Trigger Lifecycle

```mermaid
flowchart TD
    Trigger([SOS Triggered: Manual / Impact / Decibel Peak]) --> CheckMode{Is Stealth Mode Active?}
    CheckMode -- Yes --> MuteSiren[Mute Audio Siren & Switch to OLED Black #000000]
    CheckMode -- No --> SoundSiren[Force 3000Hz Siren via Audio Loudspeaker]
    
    MuteSiren --> BuildPayload[Compile Telemetry Payload: Lat, Long, Battery, Name, Timestamp]
    SoundSiren --> BuildPayload

    BuildPayload --> Tier1Attempt{Tier 1: Internet Available?}
    
    Tier1Attempt -- Yes --> SupabaseWrite[Split Write to Supabase:\n1. Public: incidents_public (GPS/Status)\n2. Private: incidents_private (Media/Audio)]
    SupabaseWrite --> SupabaseConfirm{Write Confirmed within 4000ms?}
    SupabaseConfirm -- Success --> Tier1Done([SOS Broadcast via Supabase Realtime])
    
    SupabaseConfirm -- Timeout / Failure --> Tier2Fallback
    Tier1Attempt -- No Connection --> Tier2Fallback[Tier 2: Cellular Available?]
    
    Tier2Fallback -- Yes --> CompressSMS[Compress Payload:\n'SOS|Lat,Long|Battery%|Name']
    CompressSMS --> SendSMS[Send via Native Android SmsManager / iOS Fallback to 112 & ICE Contacts]
    SendSMS --> Tier2Done([SOS Broadcast via SMS Emergency Gateway])
    
    Tier2Fallback -- No Carrier --> Tier3Mesh[Tier 3: Total Grid Collapse]
    Tier3Mesh --> BLEAdvertise[Initialize BLE Mesh via react-native-ble-plx]
    BLEAdvertise --> BroadcastPacket[Continuous BLE Advertising: Service UUID 0xFD6F\nPacket: SOS Compressed Hex Payload]
    BroadcastPacket --> NeighborMesh[Nearby PulseTrack Devices in Safe Mode Catch & Relay Payload]
    NeighborMesh --> Tier3Done([Mesh Relayed Across Neighborhood Swarm])
```

---

## 4. State Management Map (Zustand Architecture)

```
+---------------------------------------------------------------------------------------+
|                                    ZUSTAND ROOT STORE                                  |
+---------------------------------------------------------------------------------------+
| 1. useAppStore:                                                                       |
|    - theme: 'light' | 'dark' | 'oled'                                                 |
|    - activeProfile: 'default' | 'travel_solo' | 'travel_multiple' | 'disaster'        |
|    - isBackgroundActive: boolean                                                      |
|    - userProfile: { id, fullName, bloodType, iceContactPhone, emergencyNotes }         |
+---------------------------------------------------------------------------------------+
| 2. useEmergencyStore:                                                                 |
|    - activeAlertId: string | null                                                     |
|    - isEmergencyActive: boolean                                                       |
|    - activeTier: 'tier1_internet' | 'tier2_sms' | 'tier3_ble' | 'idle'                |
|    - isStealthMode: boolean                                                           |
|    - mediaStatus: 'idle' | 'recording' | 'compressing' | 'uploading' | 'sent'         |
|    - currentCoordinates: { latitude, longitude, accuracy, timestamp }                 |
+---------------------------------------------------------------------------------------+
| 3. useTelemetryStore:                                                                 |
|    - currentImpactG: number                                                           |
|    - currentNoiseDb: number                                                           |
|    - impactThresholdG: number                                                         |
|    - noiseThresholdDb: number                                                         |
|    - isThresholdLocked: boolean                                                       |
|    - batteryLevel: number                                                             |
+---------------------------------------------------------------------------------------+
| 4. useMeshStore:                                                                      |
|    - isRelayActive: boolean                                                           |
|    - discoveredTrappedNodes: Map<nodeId, TrappedNodePayload>                          |
|    - relayedPacketsCount: number                                                      |
|    - activeDangerZones: ZonePolygon[]                                                 |
|    - activeSafeZones: ZonePolygon[]                                                   |
+---------------------------------------------------------------------------------------+
```

---

## 5. Supabase Database Schema Overview

```
                          ┌──────────────────────────┐
                          │     auth.users (UUID)    │
                          └─────────────┬────────────┘
                                        │
           ┌────────────────────────────┴───────────────────────────┐
           ▼                                                        ▼
┌─────────────────────────────────┐      ┌───────────────────────────────────┐
│        incidents_public         │      │         incidents_private         │
├─────────────────────────────────┤      ├───────────────────────────────────┤
│ id: uuid (PK)                   │      │ id: uuid (PK)                     │
│ user_id: uuid (FK, nullable)    │      │ incident_id: uuid (FK -> public)  │
│ latitude: double precision      │      │ user_id: uuid (FK)                │
│ longitude: double precision     │      │ victim_name: text                 │
│ altitude: real                  │      │ ice_contact_phone: text           │
│ battery_pct: smallint           │      │ medical_notes: text               │
│ status: incident_status_enum    │      │ audio_recording_url: text         │
│ transmission_tier: tier_enum    │      │ photo_evidence_url: text          │
│ trapped_count: smallint         │      │ triage_ai_summary: text           │
│ claim_version: integer          │      │ triage_ai_priority: priority_enum │
│ claimed_by_ai: text             │      │ created_at: timestamptz           │
│ created_at: timestamptz         │      └───────────────────────────────────┘
│ updated_at: timestamptz         │
└─────────────────────────────────┘
```

### Table Separation Strategy (Zero-Cost Optimization & Privacy):
1. **`incidents_public`**:
   - Contains strictly anonymized geospatial telemetry (`latitude`, `longitude`, `status`, `battery_pct`).
   - Read permissions granted publicly to allow neighborhood safe users and field triage teams to locate victims without heavy JWT auth handshakes.
   - Houses the `claim_version` column for Postgres Optimistic Locking.
2. **`incidents_private`**:
   - Stores victim identification, ICE contact phone, uploaded audio/photo URLs, and private medical notes.
   - Locked down via Row Level Security (RLS) allowing only the owner or authenticated command center personnel to read.
3. **Data Lifecycle Retention**:
   - Scheduled `pg_cron` jobs automatically purge telemetry and media records older than 72 hours, guaranteeing zero storage overage charges on the Supabase Free Tier.
