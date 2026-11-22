import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, MIN_TOUCH, tabular } from '../../theme/emergency';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// ---------------------------------------------------------------------------
// Shell: header (back + step label + progress), scrolling body, fixed footer
// ---------------------------------------------------------------------------

interface ShellProps {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export const OnboardingShell: React.FC<ShellProps> = ({
  step,
  total = 4,
  title,
  subtitle,
  onBack,
  footer,
  children,
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color={palette.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}
            <Text style={[styles.stepLabel, tabular]}>
              STEP {step} OF {total}
            </Text>
            <View style={styles.backSpacer} />
          </View>

          <View style={styles.progressRow}>
            {Array.from({ length: total }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  { backgroundColor: i < step ? palette.textPrimary : palette.hairlineStrong },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.content}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ label, onPress, disabled, icon }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!disabled }}
    style={({ pressed }) => [
      styles.primaryBtn,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
    ]}
  >
    {icon ? <MaterialCommunityIcons name={icon} size={20} color={palette.black} /> : null}
    <Text style={styles.primaryBtnText}>{label}</Text>
  </Pressable>
);

export const SecondaryButton: React.FC<ButtonProps & { tone?: 'neutral' | 'danger' }> = ({
  label,
  onPress,
  disabled,
  icon,
  tone = 'neutral',
}) => {
  const color = tone === 'danger' ? palette.crimson : palette.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.secondaryBtn,
        { borderColor: tone === 'danger' ? palette.crimson : palette.hairlineStrong },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={20} color={color} /> : null}
      <Text style={[styles.secondaryBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Text field
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  multiline?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  showCounter?: boolean;
}

export const TextField: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  error,
  keyboardType,
  maxLength,
  multiline,
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
  showCounter,
}) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? palette.crimson : focused ? palette.cyan : palette.hairlineStrong;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { borderColor },
          keyboardType === 'phone-pad' && tabular,
        ]}
      />
      <View style={styles.fieldMetaRow}>
        <Text style={[styles.fieldHelper, error ? { color: palette.crimson } : null]}>
          {error || helper || ' '}
        </Text>
        {showCounter && maxLength ? (
          <Text style={[styles.fieldCounter, tabular]}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Info row + notice card
// ---------------------------------------------------------------------------

export const InfoRow: React.FC<{
  icon: IconName;
  accent: string;
  title: string;
  body: string;
}> = ({ icon, accent, title, body }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIcon, { borderColor: accent }]}>
      <MaterialCommunityIcons name={icon} size={22} color={accent} />
    </View>
    <View style={styles.flex}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </View>
  </View>
);

export const Notice: React.FC<{
  icon: IconName;
  accent: string;
  softBg: string;
  title: string;
  children?: React.ReactNode;
}> = ({ icon, accent, softBg, title, children }) => (
  <View style={[styles.notice, { backgroundColor: softBg, borderColor: accent }]}>
    <View style={styles.noticeHead}>
      <MaterialCommunityIcons name={icon} size={18} color={accent} />
      <Text style={[styles.noticeTitle, { color: accent }]}>{title}</Text>
    </View>
    {children ? <View style={styles.noticeBody}>{children}</View> : null}
  </View>
);

export const noticeTextStyle = {
  color: palette.textSecondary,
  fontSize: 13,
  lineHeight: 19,
} as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.bg },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },

  header: { paddingHorizontal: 20, paddingTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    backgroundColor: palette.surface,
  },
  backSpacer: { width: MIN_TOUCH, height: MIN_TOUCH },
  stepLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  progressSeg: { flex: 1, height: 3, borderRadius: 1.5 },

  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  title: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  content: { marginTop: 24 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
    backgroundColor: palette.bg,
  },

  primaryBtn: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: palette.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  primaryBtnText: { color: palette.black, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    minHeight: MIN_TOUCH,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    backgroundColor: palette.surface,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },

  fieldWrap: { marginBottom: 6 },
  fieldLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: palette.surface,
    color: palette.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 112, textAlignVertical: 'top' },
  fieldMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    minHeight: 18,
  },
  fieldHelper: { flex: 1, color: palette.textMuted, fontSize: 12, lineHeight: 17 },
  fieldCounter: { color: palette.textMuted, fontSize: 12, marginLeft: 12 },

  infoRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: '600' },
  infoBody: { color: palette.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },

  notice: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 20 },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  noticeBody: { marginTop: 8, gap: 4 },
});
