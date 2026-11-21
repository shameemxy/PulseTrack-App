export type FailSafeTier = 'tier1_internet' | 'tier2_sms' | 'tier3_ble' | 'idle';

export type UserProfileMode = 'default' | 'travel_solo' | 'travel_multiple' | 'disaster';

export type AppThemeMode = 'light' | 'dark' | 'oled';

export type MediaWorkflowState = 'idle' | 'recording' | 'compressing' | 'uploading' | 'sent' | 'error';

export type IncidentStatus = 'active' | 'acknowledged' | 'rescued' | 'resolved';

export type TriagePriority = 'critical' | 'high' | 'medium' | 'low';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  bloodType: string;
  iceContactPhone: string;
  emergencyNotes: string;
  groupName?: string;
}

export interface IncidentPublic {
  id: string;
  user_id?: string | null;
  latitude: number;
  longitude: number;
  altitude?: number;
  battery_pct: number;
  status: IncidentStatus;
  transmission_tier: FailSafeTier;
  trapped_count: number;
  claim_version: number;
  claimed_by_ai?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentPrivate {
  id: string;
  incident_id: string;
  user_id?: string | null;
  victim_name: string;
  ice_contact_phone: string;
  medical_notes?: string;
  audio_recording_url?: string | null;
  photo_evidence_url?: string | null;
  triage_ai_summary?: string | null;
  triage_ai_priority?: TriagePriority;
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
