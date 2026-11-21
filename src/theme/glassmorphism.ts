import { ViewStyle, StyleSheet } from 'react-native';
import { ColorPalette } from './colors';

export const createGlassStyle = (colors: ColorPalette, isOled: boolean = false): ViewStyle => {
  if (isOled) {
    return {
      backgroundColor: '#050505',
      borderColor: 'rgba(55, 65, 81, 0.45)',
      borderWidth: 1,
      borderRadius: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.9,
      shadowRadius: 10,
      elevation: 5,
    };
  }

  return {
    backgroundColor: colors.glassBackground,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  };
};

export const bentoStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  colFull: {
    flex: 1,
  },
  colHalf: {
    flex: 0.5,
  },
  colTwoThirds: {
    flex: 0.66,
  },
  colOneThird: {
    flex: 0.33,
  },
});
