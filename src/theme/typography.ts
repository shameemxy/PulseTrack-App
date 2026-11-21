import { TextStyle, Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'System',
  }),

  // Font weights mapped to Inter font variations
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semiBold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extraBold: '800' as TextStyle['fontWeight'],
    black: '900' as TextStyle['fontWeight'],
  },

  // Responsive font sizes
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 44,
  },

  // Pre-configured text variants
  variants: {
    h1: {
      fontSize: 32,
      fontWeight: '800' as TextStyle['fontWeight'],
      letterSpacing: -0.8,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as TextStyle['fontWeight'],
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as TextStyle['fontWeight'],
      letterSpacing: -0.3,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as TextStyle['fontWeight'],
      letterSpacing: 0.2,
    },
    monoTelemetry: {
      fontSize: 13,
      fontWeight: '700' as TextStyle['fontWeight'],
      fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
      letterSpacing: 0.5,
    },
  },
};
