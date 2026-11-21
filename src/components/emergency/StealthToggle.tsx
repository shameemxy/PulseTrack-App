import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmergencyStore } from '../../stores/useEmergencyStore';
import { audioSirenService } from '../../services/audioSiren';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const StealthToggle: React.FC = () => {
  const isStealthMode = useEmergencyStore((state) => state.isStealthMode);
  const setStealthMode = useEmergencyStore((state) => state.setStealthMode);
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const handleToggle = (value: boolean) => {
    setStealthMode(value);
    if (value) {
      audioSirenService.stopSiren();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isStealthMode ? '#000000' : colors.surfaceSubtle,
          borderColor: isStealthMode ? '#334155' : colors.cardBorder,
        },
      ]}
    >
      <View style={styles.infoRow}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isStealthMode ? '#1e293b' : 'rgba(100, 116, 139, 0.15)' },
          ]}
        >
          <MaterialCommunityIcons
            name={isStealthMode ? 'eye-off' : 'eye'}
            size={22}
            color={isStealthMode ? '#E2E8F0' : colors.textSecondary}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isStealthMode ? '#FFFFFF' : colors.textPrimary }]}>
            Stealth Concealment Mode
          </Text>
          <Text style={[styles.subtitle, { color: isStealthMode ? '#94A3B8' : colors.textMuted }]}>
            {isStealthMode
              ? 'OLED deep black active. All siren audio permanently muted.'
              : 'Silences all acoustic beacons to hide from hostile forces.'}
          </Text>
        </View>
      </View>

      <Switch
        value={isStealthMode}
        onValueChange={handleToggle}
        thumbColor={isStealthMode ? '#E2E8F0' : '#FFFFFF'}
        trackColor={{ false: '#64748B', true: '#DC2626' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    marginTop: 2,
  },
});
