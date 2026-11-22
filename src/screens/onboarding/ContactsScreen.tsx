import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  OnboardingShell,
  PrimaryButton,
  SecondaryButton,
  TextField,
  Notice,
  noticeTextStyle,
} from '../../components/onboarding/OnboardingUI';
import { useProfileStore, MAX_CONTACTS } from '../../stores/useProfileStore';
import { palette, MIN_TOUCH, tabular } from '../../theme/emergency';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Contacts'>;

/** null = form closed, 'new' = adding, otherwise the id being edited. */
type EditorTarget = null | 'new' | string;

export const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const contacts = useProfileStore((s) => s.contacts);
  const addContact = useProfileStore((s) => s.addContact);
  const updateContact = useProfileStore((s) => s.updateContact);
  const removeContact = useProfileStore((s) => s.removeContact);

  const [editor, setEditor] = useState<EditorTarget>(contacts.length === 0 ? 'new' : null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setName('');
    setRelationship('');
    setPhone('');
    setError(null);
    setEditor('new');
  };

  const openEdit = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setError(null);
    setEditor(id);
  };

  const closeEditor = () => {
    setError(null);
    setEditor(null);
  };

  const handleSave = () => {
    const input = { name, relationship, phone };
    const result = editor === 'new' ? addContact(input) : updateContact(editor as string, input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    closeEditor();
  };

  const handleRemove = (id: string, label: string) => {
    Alert.alert('Remove contact', `Remove ${label} from your emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeContact(id);
          if (editor === id) closeEditor();
        },
      },
    ]);
  };

  const atLimit = contacts.length >= MAX_CONTACTS;
  const hasContacts = contacts.length > 0;

  return (
    <OnboardingShell
      step={3}
      title="Emergency contacts"
      subtitle="These people receive your SMS alert and a private live-location link. You can save up to five."
      onBack={() => navigation.goBack()}
      footer={
        hasContacts ? (
          <PrimaryButton
            label="Continue"
            icon="arrow-right"
            onPress={() => navigation.navigate('Permissions')}
          />
        ) : (
          <SecondaryButton
            label="Continue without contacts"
            onPress={() => navigation.navigate('Permissions')}
          />
        )
      }
    >
      {!hasContacts && editor === null ? (
        <Notice
          icon="alert-outline"
          accent={palette.amber}
          softBg={palette.amberSoft}
          title="NO CONTACTS SAVED"
        >
          <Text style={noticeTextStyle}>
            Alerts will reach emergency dispatch only. Nobody you know will be told.
          </Text>
        </Notice>
      ) : null}

      {contacts.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.cardText}>
            <Text style={styles.cardName} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={[styles.cardMeta, tabular]} numberOfLines={1}>
              {c.relationship ? `${c.relationship}  |  ` : ''}
              {c.phone}
            </Text>
          </View>
          <Pressable
            onPress={() => openEdit(c.id)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${c.name}`}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={palette.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => handleRemove(c.id, c.name)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${c.name}`}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={palette.crimson} />
          </Pressable>
        </View>
      ))}

      {editor !== null ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editor === 'new' ? 'ADD CONTACT' : 'EDIT CONTACT'}</Text>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Contact name"
            maxLength={80}
            autoCapitalize="words"
            autoComplete="name"
          />
          <TextField
            label="Relationship (optional)"
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Parent, partner, friend"
            maxLength={40}
            autoCapitalize="words"
          />
          <TextField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            helper="Include the country code with a leading +."
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={24}
            error={error}
          />
          <View style={styles.formActions}>
            <View style={styles.flex}>
              <SecondaryButton label="Cancel" onPress={closeEditor} />
            </View>
            <View style={styles.flex}>
              <PrimaryButton label="Save" icon="check" onPress={handleSave} />
            </View>
          </View>
        </View>
      ) : atLimit ? (
        <Text style={styles.limitText}>Maximum of {MAX_CONTACTS} contacts reached.</Text>
      ) : (
        <SecondaryButton label="Add emergency contact" icon="account-plus-outline" onPress={openNew} />
      )}
    </OnboardingShell>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 6,
    marginBottom: 10,
  },
  cardText: { flex: 1, paddingVertical: 6 },
  cardName: { color: palette.textPrimary, fontSize: 16, fontWeight: '600' },
  cardMeta: { color: palette.textSecondary, fontSize: 13, marginTop: 3 },
  iconBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    padding: 14,
    marginTop: 4,
  },
  formTitle: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  limitText: { color: palette.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
