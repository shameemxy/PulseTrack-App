import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const ThresholdSlider: React.FC = () => {
  const currentImpactG = useTelemetryStore((state) => state.currentImpactG);
  const currentNoiseDb = useTelemetryStore((state) => state.currentNoiseDb);
  const impactThresholdG = useTelemetryStore((state) => state.impactThresholdG);
  const noiseThresholdDb = useTelemetryStore((state) => state.noiseThresholdDb);
  const isThresholdLocked = useTelemetryStore((state) => state.isThresholdLocked);
  const setImpactThreshold = useTelemetryStore((state) => state.setImpactThreshold);
  const setNoiseThreshold = useTelemetryStore((state) => state.setNoiseThreshold);
  const toggleThresholdLock = useTelemetryStore((state) => state.toggleThresholdLock);

  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const handleToggleLock = () => {
    Haptics.selectionAsync();
    toggleThresholdLock();
  };

  const adjustImpact = (delta: number) => {
    if (isThresholdLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(1.5, Math.min(8.0, impactThresholdG + delta));
    setImpactThreshold(next);
  };

  const adjustNoise = (delta: number) => {
    if (isThresholdLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(60, Math.min(120, noiseThresholdDb + delta));
    setNoiseThreshold(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="tune-vertical" size={18} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Sensor Trigger Thresholds
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleLock}
          style={[
            styles.lockButton,
            {
              backgroundColor: isThresholdLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderColor: isThresholdLocked ? colors.accentRed : colors.accentGreen,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isThresholdLocked ? 'lock' : 'lock-open-variant'}
            size={14}
            color={isThresholdLocked ? colors.accentRed : colors.accentGreen}
          />
          <Text
            style={[
              styles.lockText,
              { color: isThresholdLocked ? colors.accentRed : colors.accentGreen },
            ]}
          >
            {isThresholdLocked ? 'LOCKED (POCKET SAFE)' : 'UNLOCKED'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Impact G Trigger */}
      <View style={styles.row}>
        <View style={styles.labelCol}>
          <Text style={[styles.sensorLabel, { color: colors.textPrimary }]}>
            💥 Structural Impact
          </Text>
          <Text style={[styles.sensorSub, { color: colors.textMuted }]}>
            Live: {currentImpactG.toFixed(2)} G
          </Text>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            disabled={isThresholdLocked}
            onPress={() => adjustImpact(-0.5)}
            style={[styles.stepBtn, { opacity: isThresholdLocked ? 0.35 : 1, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.valueText, { color: colors.accentYellow }]}>
            {impactThresholdG.toFixed(1)} G
          </Text>
          <TouchableOpacity
            disabled={isThresholdLocked}
            onPress={() => adjustImpact(0.5)}
            style={[styles.stepBtn, { opacity: isThresholdLocked ? 0.35 : 1, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Noise dB Trigger */}
      <View style={styles.row}>
        <View style={styles.labelCol}>
          <Text style={[styles.sensorLabel, { color: colors.textPrimary }]}>
            🔊 Collapse Acoustic
          </Text>
          <Text style={[styles.sensorSub, { color: colors.textMuted }]}>
            Live: {currentNoiseDb} dB
          </Text>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            disabled={isThresholdLocked}
            onPress={() => adjustNoise(-5)}
            style={[styles.stepBtn, { opacity: isThresholdLocked ? 0.35 : 1, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.valueText, { color: colors.accentCyan }]}>
            {noiseThresholdDb} dB
          </Text>
          <TouchableOpacity
            disabled={isThresholdLocked}
            onPress={() => adjustNoise(5)}
            style={[styles.stepBtn, { opacity: isThresholdLocked ? 0.35 : 1, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
  },
  labelCol: {
    flex: 1,
  },
  sensorLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semiBold,
  },
  sensorSub: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    marginTop: 2,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  valueText: {
    fontFamily: typography.variants.monoTelemetry.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    minWidth: 54,
    textAlign: 'center',
  },
});
