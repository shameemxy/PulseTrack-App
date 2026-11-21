import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BentoBox } from '../components/common/BentoBox';
import { MeshRelayWidget } from '../components/safe/MeshRelayWidget';
import { ZoneMap } from '../components/safe/ZoneMap';
import { IntelCaptureModal } from '../components/safe/IntelCaptureModal';
import { useMeshStore } from '../stores/useMeshStore';
import { useAppStore } from '../stores/useAppStore';
import { telemetryService } from '../services/telemetry';
import { bleMeshService } from '../services/tier3_ble_mesh';
import { getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

export const SafeDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [intelModalVisible, setIntelModalVisible] = useState(false);
  const isRelayActive = useMeshStore((state) => state.isRelayActive);
  const setRelayActive = useMeshStore((state) => state.setRelayActive);
  const isBackgroundMonitoring = useAppStore((state) => state.isBackgroundMonitoring);
  const setMonitoringActive = useAppStore((state) => state.setMonitoringActive);

  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const handleToggleRelay = () => {
    const next = !isRelayActive;
    setRelayActive(next);
    if (next) {
      bleMeshService.startScanning();
    } else {
      bleMeshService.stopScanning();
    }
  };

  const handleDeactivateAll = () => {
    Alert.alert(
      'Deactivate All Background Monitoring?',
      'This will stop background BLE scanning, accelerometer monitoring, and acoustic sensors to save 100% of remaining battery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate & Sleep',
          style: 'destructive',
          onPress: () => {
            telemetryService.stop();
            bleMeshService.stopScanning();
            bleMeshService.stopAdvertising();
            setRelayActive(false);
            setMonitoringActive(false);
            Alert.alert('Sensors Powered Down', 'Device transitioned to ultra-low-power idle state.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Safe Citizen & Mesh Console
            </Text>
            <Text style={[styles.headerSub, { color: colors.accentGreen }]}>
              CIVILIAN VOLUNTEER RADAR
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIntelModalVisible(true)}
            style={[styles.intelBtn, { backgroundColor: colors.accentCyanSoft, borderColor: colors.accentCyan }]}
          >
            <MaterialCommunityIcons name="camera-plus" size={16} color={colors.accentCyan} />
            <Text style={[styles.intelBtnText, { color: colors.accentCyan }]}>+ INTEL</Text>
          </TouchableOpacity>
        </View>

        {/* Mesh Relay Status Bento */}
        <BentoBox
          title="BLE Mesh Relay Telemetry"
          subtitle="Autonomous ad-hoc peer relay node"
          icon={<MaterialCommunityIcons name="leak" size={20} color={colors.accentGreen} />}
          headerRight={
            <TouchableOpacity
              onPress={handleToggleRelay}
              style={[
                styles.toggleRelayBtn,
                {
                  backgroundColor: isRelayActive ? colors.accentGreenSoft : colors.surfaceSubtle,
                  borderColor: isRelayActive ? colors.accentGreen : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleRelayText,
                  { color: isRelayActive ? colors.accentGreen : colors.textMuted },
                ]}
              >
                {isRelayActive ? 'RELAY ON' : 'PAUSED'}
              </Text>
            </TouchableOpacity>
          }
          span={2}
        >
          <MeshRelayWidget />
        </BentoBox>

        {/* Interactive Tactical Map */}
        <BentoBox
          title="Interactive Danger & Safe Zones"
          subtitle="Tap trapped citizen markers to ping"
          icon={<MaterialCommunityIcons name="map-legend" size={18} color={colors.accentCyan} />}
          span={2}
        >
          <ZoneMap height={280} showTrappedPins={true} />
        </BentoBox>

        {/* Field Recon Intel Dispatch Bento */}
        <BentoBox
          title="Ground-Truth Reconnaissance"
          subtitle="Report road blocks, gas leaks, structural collapses"
          icon={<MaterialCommunityIcons name="clipboard-text-search" size={18} color={colors.accentYellow} />}
          span={2}
        >
          <TouchableOpacity
            onPress={() => setIntelModalVisible(true)}
            style={[styles.intelDispatchBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          >
            <View style={styles.intelLeft}>
              <MaterialCommunityIcons name="camera-iris" size={24} color={colors.accentCyan} />
              <View>
                <Text style={[styles.intelTitle, { color: colors.textPrimary }]}>
                  Log Field Hazard / Road Access
                </Text>
                <Text style={[styles.intelDesc, { color: colors.textMuted }]}>
                  Upload geotagged condition report to incident command
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </BentoBox>

        {/* Battery Saver Killswitch */}
        <View style={styles.killswitchContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDeactivateAll}
            style={[
              styles.killswitchBtn,
              {
                backgroundColor: !isBackgroundMonitoring ? colors.surfaceSubtle : 'rgba(239, 68, 68, 0.12)',
                borderColor: !isBackgroundMonitoring ? colors.cardBorder : colors.accentRed,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="power-standby"
              size={22}
              color={!isBackgroundMonitoring ? colors.textMuted : colors.accentRed}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.killswitchTitle,
                  { color: !isBackgroundMonitoring ? colors.textMuted : colors.accentRed },
                ]}
              >
                {!isBackgroundMonitoring
                  ? 'BACKGROUND SENSORS DEACTIVATED'
                  : 'DEACTIVATE BACKGROUND MONITORING'}
              </Text>
              <Text style={[styles.killswitchSub, { color: colors.textMuted }]}>
                Kill all sensor polling & Bluetooth mesh scanning to preserve critical phone battery
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Field Intel Capture Modal */}
      <IntelCaptureModal
        visible={intelModalVisible}
        onClose={() => setIntelModalVisible(false)}
      />
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
  headerSub: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  intelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  intelBtnText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  toggleRelayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleRelayText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  intelDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  intelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  intelTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  intelDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    marginTop: 2,
  },
  killswitchContainer: {
    marginTop: 8,
  },
  killswitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    gap: 12,
  },
  killswitchTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.black,
    letterSpacing: 0.5,
  },
  killswitchSub: {
    fontSize: typography.sizes.xs - 1,
    marginTop: 2,
  },
});
