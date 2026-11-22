import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '../../theme/emergency';

/** Minimum time the splash stays up. Total brand moment: ~1.2 s. */
export const SPLASH_MIN_MS = 1200;

interface BrandSplashProps {
  /** Fired once after SPLASH_MIN_MS. The caller decides when it is safe to leave. */
  onMinElapsed: () => void;
}

/**
 * Restrained brand moment: OLED black, a thin ring with the pulse mark and a
 * wordmark fading in, plus one slow outward ripple. No gradients, no glow.
 * Uses core Animated (native driver) so it works identically in Expo Go and
 * native builds. It never touches network or storage, so it cannot delay an
 * emergency beyond its fixed 1.2 s.
 */
export const BrandSplash: React.FC<BrandSplashProps> = ({ onMinElapsed }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const callbackRef = useRef(onMinElapsed);
  callbackRef.current = onMinElapsed;

  useEffect(() => {
    const fadeIn = Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const rippleLoop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    fadeIn.start();
    rippleLoop.start();

    const timer = setTimeout(() => callbackRef.current(), SPLASH_MIN_MS);

    return () => {
      clearTimeout(timer);
      fadeIn.stop();
      rippleLoop.stop();
    };
  }, [fade, ripple]);

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] });

  return (
    <View style={styles.container} accessibilityLabel="PulseTrack">
      <Animated.View style={[styles.center, { opacity: fade }]}>
        <View style={styles.markWrap}>
          <Animated.View
            style={[
              styles.ring,
              styles.rippleRing,
              { opacity: rippleOpacity, transform: [{ scale: rippleScale }] },
            ]}
          />
          <View style={[styles.ring, styles.staticRing]}>
            <MaterialCommunityIcons name="pulse" size={38} color={palette.textPrimary} />
          </View>
        </View>
        <Text style={styles.wordmark}>PULSETRACK</Text>
      </Animated.View>
    </View>
  );
};

const RING = 88;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  markWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticRing: { borderColor: palette.hairlineStrong },
  rippleRing: { position: 'absolute', borderColor: palette.textMuted },
  wordmark: {
    marginTop: 28,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 5,
  },
});
