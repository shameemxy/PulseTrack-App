import type { TextStyle } from 'react-native';

/**
 * Emergency-grade palette. Accents are strictly semantic:
 * crimson = emergency, emerald = safe/ok, amber = telemetry/caution, cyan = mesh/focus.
 * Pure black (#000000) is reserved for Stealth Mode and the brand splash.
 */
export const palette = {
  black: '#000000',
  bg: '#0B0D10',
  surface: '#14171D',
  surfaceRaised: '#1A1E26',
  hairline: 'rgba(255, 255, 255, 0.08)',
  hairlineStrong: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#F4F6F8',
  textSecondary: '#A3ACB9',
  textMuted: '#6E7785',
  crimson: '#EF4444',
  crimsonSoft: 'rgba(239, 68, 68, 0.12)',
  emerald: '#10B981',
  emeraldSoft: 'rgba(16, 185, 129, 0.12)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.12)',
  cyan: '#06B6D4',
  cyanSoft: 'rgba(6, 182, 212, 0.12)',
} as const;

/** Apple HIG and Material both land near 48 dp; this is the floor for every control. */
export const MIN_TOUCH = 48;

/** Fixed-width digits for coordinates, timers, phone numbers, counters. */
export const tabular: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};
