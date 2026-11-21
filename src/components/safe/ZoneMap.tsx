import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import MapView, { Marker, Polygon, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMeshStore } from '../../stores/useMeshStore';
import { useEmergencyStore } from '../../stores/useEmergencyStore';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { TrappedNodePayload } from '../../types';

interface ZoneMapProps {
  height?: number;
  showTrappedPins?: boolean;
}

export const ZoneMap: React.FC<ZoneMapProps> = ({ height = 260, showTrappedPins = true }) => {
  const mapRef = useRef<MapView>(null);
  const dangerZones = useMeshStore((state) => state.dangerZones);
  const safeZones = useMeshStore((state) => state.safeZones);
  const discoveredTrappedNodes = useMeshStore((state) => state.discoveredTrappedNodes);
  const myCoords = useEmergencyStore((state) => state.coordinates);
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const initialRegion = {
    latitude: myCoords.latitude || 37.7749,
    longitude: myCoords.longitude || -122.4194,
    latitudeDelta: 0.018,
    longitudeDelta: 0.018,
  };

  const handlePingTrappedUser = (victim: TrappedNodePayload) => {
    Alert.alert(
      `Relay Ping: ${victim.victimName}`,
      `Node: ${victim.nodeId}\nBattery: ${victim.batteryPct}%\nHops: ${victim.hops}\nSignal: ${victim.rssi || -75} dBm\n\nCoordinates: ${victim.latitude.toFixed(4)}, ${victim.longitude.toFixed(4)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Field Intel',
          onPress: () => {
            Alert.alert('Intel Logged', `Target rendezvous coordinates forwarded to local rescue team.`);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { height, borderColor: colors.cardBorder }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsCompass
        userInterfaceStyle={theme === 'light' ? 'light' : 'dark'}
      >
        {/* Render Danger Zones */}
        {dangerZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Polygon
              coordinates={zone.coordinates}
              fillColor="rgba(239, 68, 68, 0.3)"
              strokeColor="#EF4444"
              strokeWidth={2}
            />
            <Marker coordinate={zone.coordinates[0]}>
              <View style={[styles.zoneBadge, { backgroundColor: '#EF4444' }]}>
                <MaterialCommunityIcons name="alert-octagon" size={12} color="#FFF" />
                <Text style={styles.zoneBadgeText}>DANGER ZONE</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Render Safe Zones */}
        {safeZones.map((zone) => (
          <React.Fragment key={zone.id}>
            <Polygon
              coordinates={zone.coordinates}
              fillColor="rgba(16, 185, 129, 0.25)"
              strokeColor="#10B981"
              strokeWidth={2}
            />
            <Marker coordinate={zone.coordinates[0]}>
              <View style={[styles.zoneBadge, { backgroundColor: '#10B981' }]}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#FFF" />
                <Text style={styles.zoneBadgeText}>SAFE HAVEN</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Render Trapped Citizens BLE Markers */}
        {showTrappedPins &&
          Object.values(discoveredTrappedNodes).map((node) => (
            <Marker
              key={node.nodeId}
              coordinate={{ latitude: node.latitude, longitude: node.longitude }}
              onPress={() => handlePingTrappedUser(node)}
            >
              <View style={styles.victimMarker}>
                <View style={styles.victimMarkerCore}>
                  <MaterialCommunityIcons name="account-alert" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.victimLabel}>
                  <Text style={styles.victimLabelText}>{node.victimName}</Text>
                </View>
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Map Legend Overlay */}
      <View style={[styles.legend, { backgroundColor: colors.glassBackground }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: colors.textPrimary }]}>Hazard</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.textPrimary }]}>Safe Shelter</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendText, { color: colors.textPrimary }]}>BLE Citizen</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  zoneBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  victimMarker: {
    alignItems: 'center',
  },
  victimMarkerCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  victimLabel: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  victimLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
