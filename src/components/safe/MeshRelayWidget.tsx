import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMeshStore } from '../../stores/useMeshStore';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const MeshRelayWidget: React.FC = () => {
  const isRelayActive = useMeshStore((state) => state.isRelayActive);
  const discoveredTrappedNodes = useMeshStore((state) => state.discoveredTrappedNodes);
  const relayedPacketsCount = useMeshStore((state) => state.relayedPacketsCount);
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const trappedCount = Object.keys(discoveredTrappedNodes).length;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: isRelayActive ? colors.accentGreen : colors.textMuted },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isRelayActive ? colors.accentGreen : colors.textMuted },
            ]}
          >
            {isRelayActive ? 'MESH RELAY ACTIVE (P2P)' : 'RELAY PAUSED'}
          </Text>
        </View>

        <View style={[styles.packetsBadge, { backgroundColor: colors.surfaceSubtle }]}>
          <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.accentCyan} />
          <Text style={[styles.packetsText, { color: colors.accentCyan }]}>
            {relayedPacketsCount} Packets Relayed
          </Text>
        </View>
      </View>

      <View style={styles.statCardsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: trappedCount > 0 ? colors.accentRedSoft : colors.surfaceSubtle,
              borderColor: trappedCount > 0 ? colors.accentRed : colors.cardBorder,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="account-alert"
            size={24}
            color={trappedCount > 0 ? colors.accentRed : colors.textMuted}
          />
          <Text
            style={[
              styles.statNumber,
              { color: trappedCount > 0 ? colors.accentRed : colors.textPrimary },
            ]}
          >
            {trappedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            Trapped Nearby
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name="broadcast" size={24} color={colors.accentCyan} />
          <Text style={[styles.statNumber, { color: colors.accentCyan }]}>
            {isRelayActive ? '100m' : 'Off'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            BLE Radio Radius
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  packetsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packetsText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.semiBold,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  statNumber: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    marginVertical: 2,
  },
  statLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
