import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BentoBox } from '../components/common/BentoBox';
import { ModeSelector } from '../components/common/ModeSelector';
import { BigRedSOSButton } from '../components/emergency/BigRedSOSButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAppStore } from '../stores/useAppStore';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const activeProfile = useAppStore((state) => state.activeProfile);
  const colors = getThemeColors(theme);

  const isEmergencyActive = useEmergencyStore((state) => state.isEmergencyActive);
  const activeTier = useEmergencyStore((state) => state.activeTier);
  const isStealthMode = useEmergencyStore((state) => state.isStealthMode);

  const batteryLevel = useTelemetryStore((state) => state.batteryLevel);
  const currentImpactG = useTelemetryStore((state) => state.currentImpactG);
  const currentNoiseDb = useTelemetryStore((state) => state.currentNoiseDb);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navbar */}
        <View style={styles.navBar}>
          <View style={styles.brandContainer}>
            <View style={[styles.brandLogo, { backgroundColor: colors.accentRed }]}>
              <MaterialCommunityIcons name="pulse" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>PulseTrack</Text>
              <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
                NOTHING FAILS ARCHITECTURE
              </Text>
            </View>
          </View>

          <View style={styles.navActions}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
            >
              <MaterialCommunityIcons
                name={theme === 'oled' ? 'circle-outline' : theme === 'dark' ? 'weather-night' : 'weather-sunny'}
                size={18}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Fail-Safe Tier Banner */}
        <View style={styles.tierBanner}>
          <StatusBadge tier={activeTier} isStealth={isStealthMode} />
          <View style={styles.batteryBadge}>
            <MaterialCommunityIcons
              name={batteryLevel > 20 ? 'battery-high' : 'battery-alert'}
              size={16}
              color={batteryLevel > 20 ? colors.accentGreen : colors.accentRed}
            />
            <Text style={[styles.batteryText, { color: colors.textSecondary }]}>
              {batteryLevel}%
            </Text>
          </View>
        </View>

        {/* Emergency Trigger Bento Box */}
        <BentoBox span={2}>
          <BigRedSOSButton
            onTriggered={() => navigation.navigate('VictimDashboard')}
          />
        </BentoBox>

        {/* Active Emergency Quick Access if triggered */}
        {isEmergencyActive && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VictimDashboard')}
            style={[styles.activeEmergencyAlert, { backgroundColor: colors.accentRed }]}
          >
            <MaterialCommunityIcons name="alert-octagon" size={22} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeEmergencyTitle}>ACTIVE EMERGENCY IN PROGRESS</Text>
              <Text style={styles.activeEmergencySub}>Tap to enter Victim Emergency Console</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Profile Mode Selector Bento */}
        <BentoBox
          title="Profile Operating Mode"
          subtitle={`Active: ${activeProfile.toUpperCase().replace('_', ' ')}`}
          icon={<MaterialCommunityIcons name="tune" size={18} color={colors.accentCyan} />}
          span={2}
        >
          <ModeSelector />
        </BentoBox>

        {/* 2-Column Bento: Telemetry & Mesh Quick Stats */}
        <View style={styles.bentoRow}>
          <BentoBox
            title="Telemetry"
            subtitle="Live Sensors"
            icon={<MaterialCommunityIcons name="speedometer" size={16} color={colors.accentYellow} />}
            span={1}
          >
            <View style={styles.telemetryMini}>
              <View style={styles.telemetryItem}>
                <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>Impact</Text>
                <Text style={[styles.telemetryVal, { color: colors.accentYellow }]}>
                  {currentImpactG.toFixed(2)} G
                </Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>Noise</Text>
                <Text style={[styles.telemetryVal, { color: colors.accentCyan }]}>
                  {currentNoiseDb} dB
                </Text>
              </View>
            </View>
          </BentoBox>

          <BentoBox
            title="Safe Mesh"
            subtitle="Relay Radar"
            icon={<MaterialCommunityIcons name="radar" size={16} color={colors.accentGreen} />}
            span={1}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('SafeDashboard')}
              style={styles.safeRadarBtn}
            >
              <Text style={[styles.safeRadarNum, { color: colors.accentGreen }]}>2</Text>
              <Text style={[styles.safeRadarSub, { color: colors.textMuted }]}>
                Trapped in Grid
              </Text>
              <Text style={[styles.safeRadarAction, { color: colors.accentGreen }]}>
                View Radar →
              </Text>
            </TouchableOpacity>
          </BentoBox>
        </View>

        {/* Offline Survival Guide Bento */}
        <BentoBox
          title="Instant Survival Protocols"
          subtitle="100% Offline • Zero-Network Search"
          icon={<MaterialCommunityIcons name="book-cross" size={18} color={colors.accentOrange} />}
          span={2}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SurvivalGuide')}
            style={[styles.survivalButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          >
            <View style={styles.survivalLeft}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <Text style={[styles.survivalText, { color: colors.textSecondary }]}>
                Fuzzy search earthquake, fire, collapse...
              </Text>
            </View>
            <View style={[styles.zeroNetBadge, { backgroundColor: colors.accentGreenSoft }]}>
              <Text style={[styles.zeroNetText, { color: colors.accentGreen }]}>OFFLINE READY</Text>
            </View>
          </TouchableOpacity>
        </BentoBox>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  activeEmergencyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    gap: 10,
  },
  activeEmergencyTitle: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.black,
    letterSpacing: 0.5,
  },
  activeEmergencySub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.sizes.xs - 1,
    marginTop: 2,
  },
  bentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryMini: {
    gap: 8,
    paddingVertical: 4,
  },
  telemetryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
  },
  telemetryVal: {
    fontFamily: typography.variants.monoTelemetry.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  safeRadarBtn: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  safeRadarNum: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
  },
  safeRadarSub: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.medium,
  },
  safeRadarAction: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  survivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  survivalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  survivalText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
  },
  zeroNetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zeroNetText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: '800',
  },
});
