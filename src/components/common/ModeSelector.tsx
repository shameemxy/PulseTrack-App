import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/useAppStore';
import { UserProfileMode } from '../../types';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ModeOption {
  key: UserProfileMode;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  desc: string;
}

const MODES: ModeOption[] = [
  {
    key: 'default',
    label: 'Default',
    icon: 'shield-outline',
    desc: 'Baseline safety, manual triggers',
  },
  {
    key: 'travel_solo',
    label: 'Travel - Solo',
    icon: 'walk',
    desc: 'Route track, high sensitivity',
  },
  {
    key: 'travel_multiple',
    label: 'Travel - Group',
    icon: 'account-group',
    desc: 'Group mesh awareness',
  },
  {
    key: 'disaster',
    label: 'Disaster',
    icon: 'alert-decagram',
    desc: 'Max sensitivity, mesh relay',
  },
];

export const ModeSelector: React.FC = () => {
  const activeProfile = useAppStore((state) => state.activeProfile);
  const setActiveProfile = useAppStore((state) => state.setActiveProfile);
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  return (
    <View style={styles.container}>
      {MODES.map((mode) => {
        const isSelected = activeProfile === mode.key;
        const isDisaster = mode.key === 'disaster';

        return (
          <TouchableOpacity
            key={mode.key}
            activeOpacity={0.8}
            onPress={() => setActiveProfile(mode.key)}
            style={[
              styles.modeCard,
              {
                backgroundColor: isSelected
                  ? isDisaster
                    ? colors.accentRedSoft
                    : colors.accentCyanSoft
                  : colors.surfaceSubtle,
                borderColor: isSelected
                  ? isDisaster
                    ? colors.accentRed
                    : colors.accentCyan
                  : colors.cardBorder,
              },
            ]}
          >
            <View style={styles.iconRow}>
              <MaterialCommunityIcons
                name={mode.icon}
                size={20}
                color={
                  isSelected
                    ? isDisaster
                      ? colors.accentRed
                      : colors.accentCyan
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.modeLabel,
                  {
                    color: isSelected
                      ? isDisaster
                        ? colors.accentRed
                        : colors.accentCyan
                      : colors.textPrimary,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {mode.label}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.modeDesc,
                { color: isSelected ? colors.textPrimary : colors.textMuted },
              ]}
            >
              {mode.desc}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modeLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
  },
  modeDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
