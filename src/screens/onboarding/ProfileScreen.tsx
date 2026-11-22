import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  OnboardingShell,
  PrimaryButton,
  TextField,
} from '../../components/onboarding/OnboardingUI';
import { useProfileStore, NAME_NOT_PROVIDED } from '../../stores/useProfileStore';
import { BLOOD_GROUPS, type BloodGroup } from '../../types';
import { palette, MIN_TOUCH, tabular } from '../../theme/emergency';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const storedName = useProfileStore((s) => s.fullName);
  const storedBlood = useProfileStore((s) => s.bloodGroup);
  const storedNotes = useProfileStore((s) => s.medicalNotes);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [fullName, setFullName] = useState(storedName);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(storedBlood);
  const [medicalNotes, setMedicalNotes] = useState(storedNotes);

  const handleContinue = () => {
    const name = fullName.trim();
    const notes = medicalNotes.trim();
    // Only bump the sync revision when something actually changed.
    if (name !== storedName || bloodGroup !== storedBlood || notes !== storedNotes) {
      setProfile({ fullName: name, bloodGroup, medicalNotes: notes });
    }
    navigation.navigate('Contacts');
  };

  return (
    <OnboardingShell
      step={2}
      title="Your medical card"
      subtitle="Shown to responders and sent with an alert. Everything here is optional, and you can change it later."
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Continue" icon="arrow-right" onPress={handleContinue} />}
    >
      <TextField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="As responders should call you"
        helper={`If left empty, alerts show "${NAME_NOT_PROVIDED}".`}
        maxLength={80}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />

      <View style={styles.group}>
        <Text style={styles.groupLabel}>BLOOD GROUP</Text>
        <View style={styles.chipGrid}>
          {BLOOD_GROUPS.map((bg) => {
            const selected = bloodGroup === bg;
            return (
              <Pressable
                key={bg}
                onPress={() => setBloodGroup(selected ? null : bg)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Blood group ${bg}`}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selected ? palette.crimsonSoft : palette.surface,
                    borderColor: selected ? palette.crimson : palette.hairlineStrong,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    tabular,
                    { color: selected ? palette.crimson : palette.textPrimary },
                  ]}
                >
                  {bg}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.groupHelper}>Tap again to clear. Leave empty if unknown.</Text>
      </View>

      <TextField
        label="Medical notes"
        value={medicalNotes}
        onChangeText={setMedicalNotes}
        placeholder="Allergies, conditions, medication, implants"
        helper="Plain text. Keep it short; SMS fallbacks cannot carry long notes."
        maxLength={500}
        multiline
        showCounter
      />
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: 22 },
  groupLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: '23%',
    flexGrow: 1,
    minWidth: 68,
    minHeight: MIN_TOUCH,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 16, fontWeight: '700' },
  groupHelper: { color: palette.textMuted, fontSize: 12, marginTop: 8 },
  pressed: { opacity: 0.7 },
});
