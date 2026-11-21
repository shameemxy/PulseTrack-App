import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEmergencyStore } from '../../stores/useEmergencyStore';
import { executeTier1Alert } from '../../services/tier1_internet';
import { audioSirenService } from '../../services/audioSiren';
import { typography } from '../../theme/typography';

interface BigRedSOSButtonProps {
  onTriggered?: () => void;
}

export const BigRedSOSButton: React.FC<BigRedSOSButtonProps> = ({ onTriggered }) => {
  const isEmergencyActive = useEmergencyStore((state) => state.isEmergencyActive);
  const triggerEmergency = useEmergencyStore((state) => state.triggerEmergency);
  const isStealthMode = useEmergencyStore((state) => state.isStealthMode);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimer = useRef<any>(null);

  React.useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isEmergencyActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isEmergencyActive]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();

    // 1.5-second hold requirement to eliminate accidental triggers
    holdTimer.current = setTimeout(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerEmergency('MANUAL_HOLD_TRIGGER');
      
      // Dispatch 3-tier alerting
      executeTier1Alert();

      // Sound 3000Hz siren if not stealth
      if (!isStealthMode) {
        audioSirenService.startSiren();
      }

      if (onTriggered) onTriggered();
    }, 1200);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Outer Pulse Glow Ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isEmergencyActive ? 0.8 : 0.25,
            backgroundColor: isEmergencyActive ? '#FF2244' : '#DC2626',
          },
        ]}
      />

      {/* Tactile SOS Button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.buttonCore,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: isEmergencyActive ? '#990000' : '#DC2626',
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isEmergencyActive ? 'radioactive' : 'alert-octagon'}
            size={48}
            color="#FFFFFF"
          />
          <Text style={styles.buttonText}>
            {isEmergencyActive ? 'EMERGENCY\nBROADCASTING' : 'HOLD FOR\nS.O.S'}
          </Text>
          <Text style={styles.hintText}>
            {isEmergencyActive ? 'Tap to view live dashboard' : 'Hold 1.5s to trigger'}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  pressable: {
    width: 176,
    height: 176,
    borderRadius: 88,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonCore: {
    width: '100%',
    height: '100%',
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    padding: 12,
  },
  buttonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.black,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.8,
  },
  hintText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
});
