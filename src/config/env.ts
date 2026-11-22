/**
 * Central, validated environment access.
 *
 * Expo inlines EXPO_PUBLIC_* only when they are referenced statically as
 * `process.env.EXPO_PUBLIC_NAME`, so every variable is listed explicitly here.
 *
 * There are deliberately NO placeholder fallbacks for the Supabase values: a
 * missing key must surface as a visible configuration error, never as a silent
 * Tier 1 failure that quietly drops to SMS.
 */

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const rawPublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const rawWebBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? '';
const rawDispatchPhone = process.env.EXPO_PUBLIC_EMERGENCY_DISPATCH_PHONE ?? '';

export interface EnvIssue {
  key: string;
  message: string;
}

function collectIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(rawSupabaseUrl.trim())) {
    issues.push({
      key: 'EXPO_PUBLIC_SUPABASE_URL',
      message: 'Missing or not a https://<ref>.supabase.co URL.',
    });
  }
  if (rawPublishableKey.trim().length < 20) {
    issues.push({
      key: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      message: 'Missing. Copy the publishable key from Supabase Project Settings > API.',
    });
  }
  if (!/^https?:\/\//i.test(rawWebBaseUrl.trim())) {
    issues.push({
      key: 'EXPO_PUBLIC_WEB_BASE_URL',
      message: 'Missing or not an http(s) URL. Family alert links cannot be built.',
    });
  }
  return issues;
}

export const ENV_ISSUES: EnvIssue[] = collectIssues();

export const env = {
  supabaseUrl: rawSupabaseUrl.trim().replace(/\/$/, ''),
  supabasePublishableKey: rawPublishableKey.trim(),
  webBaseUrl: rawWebBaseUrl.trim().replace(/\/$/, ''),
  emergencyDispatchPhone: rawDispatchPhone.trim() || '112',
};

/** True only when Tier 1 (Supabase) can actually be attempted. */
export const isBackendConfigured: boolean = !ENV_ISSUES.some(
  (i) => i.key === 'EXPO_PUBLIC_SUPABASE_URL' || i.key === 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
);

/** True when a family alert link can be generated. */
export const isFamilyLinkConfigured: boolean = !ENV_ISSUES.some(
  (i) => i.key === 'EXPO_PUBLIC_WEB_BASE_URL'
);

export function buildFamilyAlertLink(incidentId: string, token: string): string | null {
  if (!isFamilyLinkConfigured) return null;
  return `${env.webBaseUrl}/alert/${incidentId}?token=${token}`;
}
