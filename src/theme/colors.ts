import { AppThemeMode } from '../types';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentRed: string;
  accentRedSoft: string;
  accentGreen: string;
  accentGreenSoft: string;
  accentYellow: string;
  accentYellowSoft: string;
  accentCyan: string;
  accentCyanSoft: string;
  accentOrange: string;
  glassBackground: string;
  glassBorder: string;
  stealthBlack: string;
}

export const lightColors: ColorPalette = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  card: 'rgba(255, 255, 255, 0.85)',
  cardBorder: 'rgba(203, 213, 225, 0.6)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  accentRed: '#EF4444',
  accentRedSoft: 'rgba(239, 68, 68, 0.15)',
  accentGreen: '#10B981',
  accentGreenSoft: 'rgba(16, 185, 129, 0.15)',
  accentYellow: '#F59E0B',
  accentYellowSoft: 'rgba(245, 158, 11, 0.15)',
  accentCyan: '#06B6D4',
  accentCyanSoft: 'rgba(6, 182, 212, 0.15)',
  accentOrange: '#F97316',
  glassBackground: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.45)',
  stealthBlack: '#000000',
};

export const darkColors: ColorPalette = {
  background: '#0B0F19',
  surface: '#111827',
  surfaceSubtle: '#1F2937',
  card: 'rgba(17, 24, 39, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#F9FAFB',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  accentRed: '#FF334B',
  accentRedSoft: 'rgba(255, 51, 75, 0.2)',
  accentGreen: '#10E28E',
  accentGreenSoft: 'rgba(16, 226, 142, 0.2)',
  accentYellow: '#FBBF24',
  accentYellowSoft: 'rgba(251, 191, 36, 0.2)',
  accentCyan: '#22D3EE',
  accentCyanSoft: 'rgba(34, 211, 238, 0.2)',
  accentOrange: '#FB923C',
  glassBackground: 'rgba(15, 23, 42, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  stealthBlack: '#000000',
};

// OLED Dark Theme: Strict #000000 deep blacks for maximum power savings and stealth
export const oledColors: ColorPalette = {
  background: '#000000',
  surface: '#000000',
  surfaceSubtle: '#080808',
  card: 'rgba(10, 10, 10, 0.95)',
  cardBorder: 'rgba(50, 50, 50, 0.5)',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  accentRed: '#DC2626',
  accentRedSoft: 'rgba(220, 38, 38, 0.18)',
  accentGreen: '#059669',
  accentGreenSoft: 'rgba(5, 150, 105, 0.18)',
  accentYellow: '#D97706',
  accentYellowSoft: 'rgba(217, 119, 6, 0.18)',
  accentCyan: '#0891B2',
  accentCyanSoft: 'rgba(8, 145, 178, 0.18)',
  accentOrange: '#EA580C',
  glassBackground: 'rgba(5, 5, 5, 0.92)',
  glassBorder: 'rgba(40, 40, 40, 0.6)',
  stealthBlack: '#000000',
};

export const getThemeColors = (mode: AppThemeMode): ColorPalette => {
  if (mode === 'oled') return oledColors;
  if (mode === 'light') return lightColors;
  return darkColors;
};
