import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BentoBox } from '../components/common/BentoBox';
import { StatusBadge } from '../components/common/StatusBadge';
import { MediaStateMachine } from '../components/emergency/MediaStateMachine';
import { StealthToggle } from '../components/emergency/StealthToggle';
import { ThresholdSlider } from '../components/emergency/ThresholdSlider';
import { ZoneMap } from '../components/safe/ZoneMap';
import { useEmergencyStore } from '../stores/useEmergencyStore';
import { useAppStore } from '../stores/useAppStore';
import { audioSirenService } from '../services/audioSiren';
import { getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

export const VictimDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isEmergencyActive = useEmergencyStore((state) => state.isEmergencyActive);
  const activeAlertId = useEmergencyStore((state) => state.activeAlertId);
  const activeTier = useEmergencyStore((state) => state.activeTier);
  const isStealthMode = useEmergencyStore((state) => state.isStealthMode);
  const isSirenRinging = useEmergencyStore((state) => state.isSirenRinging);
  const resolveEmergency = useEmergencyStore((state) => state.resolveEmergency);
  const coordinates = useEmergencyStore((state) => state.coordinates);

  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const handleToggleSiren = () => {
    if (isStealthMode) {
      Alert.alert('Inhibited', 'Cannot activate loudspeaker while Stealth Mode is active.');
      return;
    }
    if (isSirenRinging) {
      audioSirenService.stopSiren();
    } else {
      audioSirenService.startSiren();
    }
  };

  const handleResolveAlert = () => {
    Alert.alert(
      'Resolve Emergency?',
      'Are you safe? This will deactivate the 3000Hz acoustic siren and stop emergency mesh beacon transmissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Am Safe (Resolve)',
          style: 'destructive',
          onPress: () => {
            audioSirenService.stopSiren();
            resolveEmergency();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Victim Emergency Console
            </Text>
            <Text style={[styles.alertId, { color: colors.accentRed }]}>
              {activeAlertId || 'BROADCAST ACTIVE'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleResolveAlert}
            style={[styles.resolveBtn, { backgroundColor: colors.accentGreenSoft, borderColor: colors.accentGreen }]}
          >
            <Text style={[styles.resolveBtnText, { color: colors.accentGreen }]}>I'M SAFE</Text>
          </TouchableOpacity>
        </View>

        {/* Tier & Stealth Status Bar */}
        <View style={styles.statusRow}>
          <StatusBadge tier={activeTier} isStealth={isStealthMode} />
          <View style={styles.gpsBadge}>
            <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.accentCyan} />
            <Text style={[styles.gpsText, { color: colors.textSecondary }]}>
              {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Stealth Mode Toggle Bento */}
        <BentoBox span={2}>
          <StealthToggle />
        </BentoBox>

        {/* 3000Hz Loudspeaker Siren Control Bento */}
        <BentoBox
          title="3000Hz Acoustic Beacon"
          subtitle="Forces audio through primary loudspeaker"
          icon={<MaterialCommunityIcons name="volume-high" size={20} color={colors.accentRed} />}
          span={2}
        >
          <View style={styles.sirenRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sirenStateText, { color: isSirenRinging ? colors.accentRed : colors.textSecondary }]}>
                {isStealthMode
                  ? 'MUTED BY STEALTH PROTOCOL'
                  : isSirenRinging
                  ? 'SIREN BLASTING (MAX GAIN)'
                  : 'Siren Standby'}
              </Text>
              <Text style={[styles.sirenDesc, { color: colors.textMuted }]}>
                {isSirenRinging
                  ? 'Acoustic pulse penetrating concrete rubble for search teams.'
                  : 'Tap to trigger high-pitch location sound.'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleToggleSiren}
              disabled={isStealthMode}
              style={[
                styles.sirenToggleBtn,
                {
                  backgroundColor: isStealthMode
                    ? colors.surfaceSubtle
                    : isSirenRinging
                    ? colors.accentRed
                    : colors.surfaceSubtle,
                  borderColor: isSirenRinging ? colors.accentRed : colors.cardBorder,
                  opacity: isStealthMode ? 0.4 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isSirenRinging ? 'volume-off' : 'volume-high'}
                size={22}
                color={isSirenRinging ? '#FFFFFF' : colors.textPrimary}
              />
              <Text
                style={[
                  styles.sirenToggleText,
                  { color: isSirenRinging ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {isSirenRinging ? 'MUTE SIREN' : 'SOUND SIREN'}
              </Text>
            </TouchableOpacity>
          </View>
        </BentoBox>

        {/* Media State Machine: [Recording] -> [Uploading] -> [Sent] */}
        <BentoBox
          title="Field Voice & Media Triage"
          subtitle="Direct transmission to command center"
          icon={<MaterialCommunityIcons name="camera-metering-spot" size={18} color={colors.accentCyan} />}
          span={2}
        >
          <MediaStateMachine />
        </BentoBox>

        {/* Live Map Bento */}
        <BentoBox
          title="Live Emergency Geospatial Pin"
          subtitle="Real-time GPS coordinate telemetry"
          icon={<MaterialCommunityIcons name="map-marker-radius" size={18} color={colors.accentGreen} />}
          span={2}
        >
          <ZoneMap height={220} showTrappedPins={false} />
        </BentoBox>

        {/* Threshold Locks Bento */}
        <BentoBox span={2}>
          <ThresholdSlider />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  alertId: {
    fontFamily: typography.variants.monoTelemetry.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  resolveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  resolveBtnText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsText: {
    fontFamily: typography.variants.monoTelemetry.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  sirenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sirenStateText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  sirenDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    marginTop: 2,
  },
  sirenToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  sirenToggleText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
  },
});
