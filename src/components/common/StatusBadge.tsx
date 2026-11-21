import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FailSafeTier } from '../../types';
import { typography } from '../../theme/typography';

interface StatusBadgeProps {
  tier: FailSafeTier;
  isStealth?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ tier, isStealth }) => {
  if (isStealth) {
    return (
      <View style={[styles.badge, styles.stealthBadge]}>
        <MaterialCommunityIcons name="eye-off" size={14} color="#94A3B8" />
        <Text style={[styles.badgeText, { color: '#94A3B8' }]}>STEALTH ACTIVE (MUTED)</Text>
      </View>
    );
  }

  switch (tier) {
    case 'tier1_internet':
      return (
        <View style={[styles.badge, styles.tier1Badge]}>
          <MaterialCommunityIcons name="cloud-check" size={14} color="#10B981" />
          <Text style={[styles.badgeText, { color: '#10B981' }]}>TIER 1: CLOUD SYNCED</Text>
        </View>
      );
    case 'tier2_sms':
      return (
        <View style={[styles.badge, styles.tier2Badge]}>
          <MaterialCommunityIcons name="message-alert" size={14} color="#F59E0B" />
          <Text style={[styles.badgeText, { color: '#F59E0B' }]}>TIER 2: CELLULAR SMS</Text>
        </View>
      );
    case 'tier3_ble':
      return (
        <View style={[styles.badge, styles.tier3Badge]}>
          <MaterialCommunityIcons name="bluetooth-connect" size={14} color="#EF4444" />
          <Text style={[styles.badgeText, { color: '#EF4444' }]}>TIER 3: BLE MESH BEACON</Text>
        </View>
      );
    default:
      return (
        <View style={[styles.badge, styles.idleBadge]}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#64748B" />
          <Text style={[styles.badgeText, { color: '#64748B' }]}>FAIL-SAFE STANDBY</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  tier1Badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tier2Badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  tier3Badge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  stealthBadge: {
    backgroundColor: '#0a0a0a',
    borderColor: '#334155',
  },
  idleBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
});
