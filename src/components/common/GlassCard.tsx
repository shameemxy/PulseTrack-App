import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 30,
  borderRadius = 20,
  ...rest
}) => {
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const isOled = theme === 'oled';

  if (isOled) {
    return (
      <View
        style={[
          styles.oledBase,
          {
            borderRadius,
            borderColor: colors.cardBorder,
            backgroundColor: colors.card,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.glassContainer,
        {
          borderRadius,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView
        intensity={intensity}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View style={{ flex: 1, padding: 16 }}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  oledBase: {
    borderWidth: 1.2,
    padding: 16,
  },
});
