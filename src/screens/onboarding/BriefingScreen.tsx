import React from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  OnboardingShell,
  PrimaryButton,
  InfoRow,
  Notice,
  noticeTextStyle,
} from '../../components/onboarding/OnboardingUI';
import { ENV_ISSUES } from '../../config/env';
import { useProfileStore } from '../../stores/useProfileStore';
import { palette } from '../../theme/emergency';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Briefing'>;

export const BriefingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const setBriefingSeen = useProfileStore((s) => s.setBriefingSeen);

  const handleContinue = () => {
    setBriefingSeen();
    navigation.navigate('Profile');
  };

  return (
    <OnboardingShell
      step={1}
      title="How PulseTrack alerts"
      subtitle="Three delivery channels, tried in order. Here is what each can and cannot do on your phone."
      footer={<PrimaryButton label="Continue" icon="arrow-right" onPress={handleContinue} />}
    >
      {ENV_ISSUES.length > 0 ? (
        <Notice
          icon="alert-circle-outline"
          accent={palette.amber}
          softBg={palette.amberSoft}
          title="CONFIGURATION INCOMPLETE"
        >
          {ENV_ISSUES.map((issue) => (
            <Text key={issue.key} style={noticeTextStyle}>
              {issue.key}: {issue.message}
            </Text>
          ))}
          <Text style={noticeTextStyle}>
            Cloud alerts stay disabled until these are set. SMS and Bluetooth channels are unaffected.
          </Text>
        </Notice>
      ) : null}

      <InfoRow
        icon="cloud-upload-outline"
        accent={palette.emerald}
        title="1. Cloud"
        body="With internet, your position, battery and medical details reach responders and your family link immediately. Alerts that cannot send are stored on the device and retried until delivered."
      />
      <InfoRow
        icon="message-text-outline"
        accent={palette.amber}
        title="2. SMS"
        body="Without internet, a compact SMS goes to emergency dispatch and your contacts. Android sends it silently in the background. On iPhone, iOS requires you to press Send in a pre-filled message; an app cannot send it for you."
      />
      <InfoRow
        icon="bluetooth-connect"
        accent={palette.cyan}
        title="3. Bluetooth mesh"
        body="Nearby PulseTrack phones can pick up a beacon. Scanning works on a native build. Broadcasting needs extra native support and is reported as unavailable until it is present, never as success. Expo Go on iPhone has no Bluetooth mesh."
      />
      <InfoRow
        icon="cellphone-lock"
        accent={palette.textSecondary}
        title="Background limits"
        body="iOS and Android restrict what apps can do while the screen is off. PulseTrack tells you when a feature is limited by the operating system instead of pretending it works."
      />

      <Notice
        icon="shield-alert-outline"
        accent={palette.crimson}
        softBg={palette.crimsonSoft}
        title="NOT A REPLACEMENT FOR EMERGENCY SERVICES"
      >
        <Text style={noticeTextStyle}>
          If you can place a call, call your local emergency number first.
        </Text>
      </Notice>
    </OnboardingShell>
  );
};
