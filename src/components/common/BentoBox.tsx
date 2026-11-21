import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface BentoBoxProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  span?: 1 | 2; // 1 = half width, 2 = full width
  height?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const BentoBox: React.FC<BentoBoxProps> = ({
  title,
  subtitle,
  icon,
  headerRight,
  span = 2,
  height,
  style,
  children,
}) => {
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  return (
    <View style={[span === 2 ? styles.colFull : styles.colHalf, style]}>
      <GlassCard style={height ? { minHeight: height } : undefined}>
        {(title || icon || headerRight) && (
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <View>
                {title && (
                  <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                )}
                {subtitle && (
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                )}
              </View>
            </View>
            {headerRight && <View>{headerRight}</View>}
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  colFull: {
    width: '100%',
    marginBottom: 12,
  },
  colHalf: {
    width: '48.5%',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
});
