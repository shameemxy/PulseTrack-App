import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Linking, AppState, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { AudioModule } from 'expo-audio';
import {
  OnboardingShell,
  PrimaryButton,
  Notice,
  noticeTextStyle,
} from '../../components/onboarding/OnboardingUI';
import { useProfileStore } from '../../stores/useProfileStore';
import { palette, MIN_TOUCH } from '../../theme/emergency';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Permissions'>;
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PermKey = 'location' | 'microphone' | 'camera' | 'notifications';

interface PermState {
  granted: boolean;
  canAskAgain: boolean;
  /** True when the platform call itself failed (module missing, simulator). */
  unavailable: boolean;
}

const INITIAL: PermState = { granted: false, canAskAgain: true, unavailable: false };

const UNAVAILABLE: PermState = { granted: false, canAskAgain: false, unavailable: true };

async function readPermission(key: PermKey): Promise<PermState> {
  try {
    if (key === 'location') {
      const r = await Location.getForegroundPermissionsAsync();
      return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
    }
    if (key === 'notifications') {
      const r = await Notifications.getPermissionsAsync();
      return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
    }
    if (key === 'camera') {
      const r = await Camera.getCameraPermissionsAsync();
      return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
    }
    const r = await AudioModule.getRecordingPermissionsAsync();
    return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
  } catch {
    return UNAVAILABLE;
  }
}

async function requestPermission(key: PermKey): Promise<PermState> {
  try {
    if (key === 'location') {
      const r = await Location.requestForegroundPermissionsAsync();
      return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
    }
    if (key === 'notifications') {
      const r = await Notifications.requestPermissionsAsync();
      return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
    }
    if (key === 'camera') {
      const r = await Camera.requestCameraPermissionsAsync();
      return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
    }
    const r = await AudioModule.requestRecordingPermissionsAsync();
    return { granted: r.granted, canAskAgain: r.canAskAgain, unavailable: false };
  } catch {
    return UNAVAILABLE;
  }
}

interface PermRow {
  key: PermKey;
  icon: IconName;
  title: string;
  why: string;
}

const ROWS: PermRow[] = [
  {
    key: 'location',
    icon: 'crosshairs-gps',
    title: 'Location',
    why: 'Sends your coordinates to responders and shows your position on the map.',
  },
  {
    key: 'microphone',
    icon: 'microphone-outline',
    title: 'Microphone',
    why: 'Records a short voice clip during an emergency.',
  },
  {
    key: 'camera',
    icon: 'camera-outline',
    title: 'Camera',
    why: 'Captures photo or short video evidence for responders.',
  },
  {
    key: 'notifications',
    icon: 'bell-outline',
    title: 'Notifications',
    why: 'Lets safety timers alert you even when the app is closed.',
  },
];

export const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);

  const [perms, setPerms] = useState<Record<PermKey, PermState>>({
    location: INITIAL,
    microphone: INITIAL,
    camera: INITIAL,
    notifications: INITIAL,
  });

  const refreshAll = useCallback(async () => {
    const [location, microphone, camera, notifications] = await Promise.all([
      readPermission('location'),
      readPermission('microphone'),
      readPermission('camera'),
      readPermission('notifications'),
    ]);
    setPerms({ location, microphone, camera, notifications });
  }, []);

  useEffect(() => {
    void refreshAll();
    // Re-read after the user returns from system Settings.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshAll();
    });
    return () => sub.remove();
  }, [refreshAll]);

  const handleRequest = async (key: PermKey) => {
    const next = await requestPermission(key);
    setPerms((prev) => ({ ...prev, [key]: next }));
  };

  const locationGranted = perms.location.granted;

  return (
    <OnboardingShell
      step={4}
      title="Device access"
      subtitle="Each permission is requested by the system and can be changed later in Settings."
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Finish setup" icon="check" onPress={completeOnboarding} />}
    >
      {ROWS.map((row) => {
        const p = perms[row.key];
        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name={row.icon} size={22} color={palette.textPrimary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowWhy}>{row.why}</Text>
            </View>
            <StatusAction
              state={p}
              onRequest={() => handleRequest(row.key)}
              onOpenSettings={() => void Linking.openSettings()}
            />
          </View>
        );
      })}

      {!locationGranted ? (
        <Notice
          icon="alert-outline"
          accent={palette.amber}
          softBg={palette.amberSoft}
          title="LOCATION IS OFF"
        >
          <Text style={noticeTextStyle}>
            Without location, alerts are sent without coordinates and responders cannot find you.
          </Text>
        </Notice>
      ) : null}

      <Text style={styles.footnote}>
        Background location and Bluetooth are requested later, when you enable a feature that needs them.
      </Text>
    </OnboardingShell>
  );
};

const StatusAction: React.FC<{
  state: PermState;
  onRequest: () => void;
  onOpenSettings: () => void;
}> = ({ state, onRequest, onOpenSettings }) => {
  if (state.unavailable) {
    return (
      <View style={[styles.pill, { borderColor: palette.hairlineStrong }]}>
        <Text style={[styles.pillText, { color: palette.textMuted }]}>Unavailable</Text>
      </View>
    );
  }
  if (state.granted) {
    return (
      <View style={[styles.pill, { borderColor: palette.emerald, backgroundColor: palette.emeraldSoft }]}>
        <MaterialCommunityIcons name="check" size={16} color={palette.emerald} />
        <Text style={[styles.pillText, { color: palette.emerald }]}>Granted</Text>
      </View>
    );
  }
  const needsSettings = !state.canAskAgain;
  return (
    <Pressable
      onPress={needsSettings ? onOpenSettings : onRequest}
      accessibilityRole="button"
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.actionText}>{needsSettings ? 'Settings' : 'Allow'}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    padding: 14,
    marginBottom: 10,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: '600' },
  rowWhy: { color: palette.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  actionBtn: {
    minWidth: 76,
    minHeight: MIN_TOUCH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cyan,
    backgroundColor: palette.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionText: { color: palette.cyan, fontSize: 14, fontWeight: '700' },
  pill: {
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  footnote: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
