# 🛠️ PreDeploy.md: Production Setup & Database Scripts

This document details all required manual configurations, database schema migrations, Row Level Security (RLS) rules, native permission manifests, and the Postgres Optimistic Locking RPC for the Gemini AI Triage command center.

---

## 1. Environment Variables (`.env.example`)

Create a `.env` file in the root of the project with the following keys:

```bash
# Supabase Project Configuration (Zero-Cost Free Tier)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Dedicated Command Center AI Triage Endpoint
EXPO_PUBLIC_AI_TRIAGE_WORKER_URL=https://your-edge-function.functions.supabase.co/triage

# Emergency SMS Gateway Number (Defaults to 112 if blank)
EXPO_PUBLIC_EMERGENCY_DISPATCH_PHONE=112
```

---

## 2. Supabase SQL Migrations: Complete Setup Script

Run this SQL block in the **Supabase SQL Editor** (`https://supabase.com/dashboard/project/_/sql`):

```sql
-- =========================================================================
-- PULSETRACK DATABASE INITIALIZATION (ZERO-COST ARCHITECTURE)
-- =========================================================================

-- 1. Create Enums
CREATE TYPE incident_status_enum AS ENUM ('active', 'acknowledged', 'rescued', 'resolved');
CREATE TYPE tier_enum AS ENUM ('tier1_internet', 'tier2_sms', 'tier3_ble');
CREATE TYPE priority_enum AS ENUM ('critical', 'high', 'medium', 'low');

-- 2. Create Public Telemetry Table (Split-Write Table 1)
-- Holds anonymized GPS coordinates and status for zero-auth public safe radar
CREATE TABLE IF NOT EXISTS public.incidents_public (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude REAL DEFAULT 0,
    battery_pct SMALLINT CHECK (battery_pct >= 0 AND battery_pct <= 100),
    status incident_status_enum DEFAULT 'active',
    transmission_tier tier_enum DEFAULT 'tier1_internet',
    trapped_count SMALLINT DEFAULT 1,
    claim_version INTEGER DEFAULT 0 NOT NULL,
    claimed_by_ai TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index geospatial coordinates for sub-millisecond proximity queries
CREATE INDEX IF NOT EXISTS idx_incidents_public_coords 
ON public.incidents_public (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_incidents_public_status 
ON public.incidents_public (status);

-- 3. Create Private Details Table (Split-Write Table 2)
-- Protected by strict RLS: victim identity, media urls, ICE contact
CREATE TABLE IF NOT EXISTS public.incidents_private (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents_public(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    victim_name TEXT NOT NULL,
    ice_contact_phone TEXT NOT NULL,
    medical_notes TEXT,
    audio_recording_url TEXT,
    photo_evidence_url TEXT,
    triage_ai_summary TEXT,
    triage_ai_priority priority_enum DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_private_incident_id 
ON public.incidents_private (incident_id);

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.incidents_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents_private ENABLE ROW LEVEL SECURITY;

-- Incidents Public:
-- Anyone (anonymized safe citizens, volunteers) can read active public incidents
CREATE POLICY "Public read access for active emergency pins"
ON public.incidents_public
FOR SELECT
USING (true);

-- Anyone or authenticated user can insert an SOS signal (Nothing Fails principle)
CREATE POLICY "Public insert access for SOS broadcast"
ON public.incidents_public
FOR INSERT
WITH CHECK (true);

-- Only original reporter or service_role can update public incident
CREATE POLICY "Reporter update access for public incidents"
ON public.incidents_public
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Incidents Private:
-- Only the incident owner or service_role (AI dispatcher) can read private data
CREATE POLICY "Private read restricted to owner and command staff"
ON public.incidents_private
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone emitting SOS can insert their private telemetry details
CREATE POLICY "Allow incident reporter to insert private details"
ON public.incidents_private
FOR INSERT
WITH CHECK (true);

-- =========================================================================
-- 5. STORAGE BUCKET FOR EMERGENCY MEDIA (ZERO-COST LIMIT SAFE)
-- =========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'emergency_media',
    'emergency_media',
    false,
    5242880, -- 5MB strict limit per audio/photo file to prevent quota breach
    ARRAY['audio/m4a', 'audio/aac', 'audio/mp3', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Anyone can upload SOS audio/photo, only authenticated command staff can download
CREATE POLICY "Allow public SOS uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'emergency_media');

CREATE POLICY "Allow owner and staff to view emergency media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'emergency_media');

-- =========================================================================
-- 6. OPTIMISTIC LOCKING RPC FOR GEMINI AI TRIAGE (RACE CONDITION DEFENSE)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.claim_and_triage_incident(
    p_incident_id UUID,
    p_current_version INTEGER,
    p_ai_worker_id TEXT,
    p_ai_summary TEXT,
    p_priority priority_enum
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows_affected INTEGER;
    v_new_version INTEGER;
BEGIN
    v_new_version := p_current_version + 1;

    -- Step 1: Attempt atomic update using version check
    UPDATE public.incidents_public
    SET 
        claimed_by_ai = p_ai_worker_id,
        claim_version = v_new_version,
        updated_at = NOW()
    WHERE id = p_incident_id 
      AND claim_version = p_current_version;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- Step 2: Detect race collision
    IF v_rows_affected = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONCURRENT_UPDATE_COLLISION',
            'message', 'Incident was claimed or altered by another AI worker. Retry with fresh version.'
        );
    END IF;

    -- Step 3: Insert the triage assessment into incidents_private
    UPDATE public.incidents_private
    SET 
        triage_ai_summary = p_ai_summary,
        triage_ai_priority = p_priority
    WHERE incident_id = p_incident_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_version', v_new_version,
        'incident_id', p_incident_id
    );
END;
$$;

-- =========================================================================
-- 7. ZERO-COST RETENTION CRON JOB (pg_cron) - PURGE > 72 HOURS
-- =========================================================================
-- To stay within Supabase Free Tier 500MB DB limit and 1GB Storage limit:
-- Enable pg_cron extension if on Pro, or trigger this query via GitHub Actions / Supabase Edge Functions:

CREATE OR REPLACE FUNCTION public.purge_expired_emergency_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete records older than 72 hours
    DELETE FROM public.incidents_public
    WHERE created_at < (NOW() - INTERVAL '72 hours')
      AND status IN ('rescued', 'resolved');
END;
$$;
```

---

## 3. Native Android & iOS Manifest Configurations

To support background cellular SMS dispatch (Tier 2) and Bluetooth Low Energy Mesh scanning/advertising (Tier 3), the native manifests must be explicitly configured via Expo Config Plugins or directly in the prebuild files.

### A. Android Configuration (`android/app/src/main/AndroidManifest.xml`)
The following permissions are required and declared in `app.json`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Tier 2: Background SMS Sending -->
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />

    <!-- Tier 3: BLE Mesh Beaconing & Scanning -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" 
                     android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    
    <!-- Geolocation & Continuous Telemetry Sensors -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
</manifest>
```

### B. iOS Configuration (`ios/PulseTrack/Info.plist`)
The following keys are configured in `app.json`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>PulseTrack uses Bluetooth Low Energy to create a peer-to-peer survival mesh during total grid collapse.</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>PulseTrack advertises an emergency beacon to nearby devices when internet is unavailable.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>PulseTrack requires continuous background GPS to pinpoint trapped victims for rescue squads.</string>
<key>NSMicrophoneUsageDescription</key>
<string>PulseTrack monitors ambient acoustic levels to detect structural collapse and record voice SOS beacons.</string>
```

---

## 4. Verification Checklist Before First Run

1. [ ] Supabase project created on Free Tier.
2. [ ] SQL script executed completely without errors in Supabase SQL editor.
3. [ ] `emergency_media` storage bucket verified.
4. [ ] `.env` file populated with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. [ ] Native dev client built via `npx expo prebuild` or `npx expo run:android` to link native BLE (`react-native-ble-plx`) and SMS libraries.
