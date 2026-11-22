export type FailSafeTier = 'tier1_internet' | 'tier2_sms' | 'tier3_ble' | 'idle';

export type UserProfileMode = 'default' | 'travel_solo' | 'travel_multiple' | 'disaster';

export type AppThemeMode = 'light' | 'dark' | 'oled';

export type MediaWorkflowState = 'idle' | 'recording' | 'compressing' | 'uploading' | 'sent' | 'error';

export type IncidentStatus = 'active' | 'acknowledged' | 'rescued' | 'resolved';

export type TriagePriority = 'critical' | 'high' | 'medium' | 'low';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** State of one delivery channel for the live receipts shown to the victim. */
export type DeliveryChannelState =
  | 'idle'
  | 'pending'
  | 'ok'
  | 'failed'
  | 'unavailable';

export interface DeliveryState {
  cloud: DeliveryChannelState;
  sms: DeliveryChannelState;
  ble: DeliveryChannelState;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp: number;
}

/** Locally persisted, user-entered emergency contact. */
export interface EmergencyContact {
  id: string; // uuid v4, also the primary key in public.emergency_contacts
  name: string;
  relationship: string;
  phone: string; // digits with optional leading +, 5-15 digits
}

/** Row shape of public.incidents_public (live schema, Phase 1A migration). */
export interface IncidentPublic {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  battery_pct: number | null;
  impact_g: number | null;
  audio_db: number | null;
  mode: UserProfileMode;
  trigger_reason: string | null;
  status: IncidentStatus;
  transmission_tier: Exclude<FailSafeTier, 'idle'>;
  trapped_count: number;
  claim_version: number;
  claimed_by_ai: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  rescued_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape of public.incidents_private. */
export interface IncidentPrivate {
  incident_id: string;
  user_id: string;
  victim_name: string;
  blood_group: string | null;
  medical_notes: string | null;
  ice_contacts: { name: string; relationship: string; phone: string }[];
  ai_status: 'pending' | 'processing' | 'complete' | 'failed';
  ai_summary: string | null;
  ai_priority: TriagePriority | null;
  locked_at: string | null;
  created_at: string;
}

/** Row shape of public.incident_media. */
export interface IncidentMedia {
  id: string;
  incident_id: string;
  user_id: string;
  kind: 'audio' | 'video' | 'photo';
  storage_path: string;
  mime_type: string | null;
  duration_ms: number | null;
  transcript: string | null;
  transcript_status: 'pending' | 'processing' | 'complete' | 'failed' | 'not_applicable';
  captured_at: string;
  storage_removed_at: string | null;
  created_at: string;
}

export interface TrappedNodePayload {
  nodeId: string;
  victimName: string;
  latitude: number;
  longitude: number;
  batteryPct: number;
  timestamp: number;
  rssi?: number;
  hops: number;
}

export interface ZonePolygon {
  id: string;
  type: 'danger' | 'safe';
  title: string;
  description: string;
  coordinates: { latitude: number; longitude: number }[];
  radiusMeters?: number;
}

export interface SurvivalProtocol {
  id: string;
  category: 'earthquake' | 'flood' | 'fire' | 'collapse' | 'medical' | 'hostile' | 'general';
  title: string;
  summary: string;
  criticalSteps: string[];
  dos: string[];
  donts: string[];
  tags: string[];
}
