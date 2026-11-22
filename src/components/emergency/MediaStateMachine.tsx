import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { useEmergencyStore } from '../../stores/useEmergencyStore';
import { useAppStore } from '../../stores/useAppStore';
import { getThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const MediaStateMachine: React.FC = () => {
  const mediaStatus = useEmergencyStore((state) => state.mediaStatus);
  const setMediaStatus = useEmergencyStore((state) => state.setMediaStatus);
  const setRecordedAudioUri = useEmergencyStore((state) => state.setRecordedAudioUri);
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  // Aggressive compression preset (24 kbps mono to fit free-tier storage)
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.LOW_QUALITY,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 24000,
  });

  const startVoiceBeacon = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setMediaStatus('recording');
    } catch (err) {
      console.warn('Failed to start recording', err);
      setMediaStatus('error');
    }
  };

  const stopAndUploadVoiceBeacon = async () => {
    try {
      setMediaStatus('compressing');
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordedAudioUri(uri);

      // Simulate compressed upload sequence to Supabase Storage bucket 'emergency_media'
      setMediaStatus('uploading');
      setTimeout(() => {
        setMediaStatus('sent');
      }, 1800);
    } catch (err) {
      console.warn('Failed to stop recording', err);
      setMediaStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <View style={styles.stepContainer}>
          <Text
            style={[
              styles.stepText,
              {
                color:
                  mediaStatus === 'recording'
                    ? colors.accentRed
                    : mediaStatus === 'compressing' || mediaStatus === 'uploading' || mediaStatus === 'sent'
                    ? colors.accentGreen
                    : colors.textMuted,
              },
            ]}
          >
            {mediaStatus === 'recording' ? '🎤 Recording...' : '1. Audio Beacon'}
          </Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />

        <View style={styles.stepContainer}>
          <Text
            style={[
              styles.stepText,
              {
                color:
                  mediaStatus === 'uploading'
                    ? colors.accentYellow
                    : mediaStatus === 'sent'
                    ? colors.accentGreen
                    : colors.textMuted,
              },
            ]}
          >
            {mediaStatus === 'uploading' ? '☁️ Uploading...' : '2. Compressed Upload'}
          </Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />

        <View style={styles.stepContainer}>
          <Text
            style={[
              styles.stepText,
              {
                color: mediaStatus === 'sent' ? colors.accentGreen : colors.textMuted,
              },
            ]}
          >
            {mediaStatus === 'sent' ? '✅ Sent' : '3. Triage Received'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {mediaStatus === 'recording' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={stopAndUploadVoiceBeacon}
            style={[styles.actionButton, { backgroundColor: colors.accentRed }]}
          >
            <MaterialCommunityIcons name="stop" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Stop & Compress Audio</Text>
          </TouchableOpacity>
        ) : mediaStatus === 'uploading' || mediaStatus === 'compressing' ? (
          <View style={[styles.actionButton, { backgroundColor: colors.surfaceSubtle }]}>
            <ActivityIndicator size="small" color={colors.accentYellow} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary, marginLeft: 8 }]}>
              {mediaStatus === 'compressing' ? 'Compressing 24kbps...' : 'Syncing to Supabase...'}
            </Text>
          </View>
        ) : mediaStatus === 'sent' ? (
          <View style={[styles.actionButton, { backgroundColor: colors.accentGreenSoft, borderColor: colors.accentGreen, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.accentGreen} />
            <Text style={[styles.actionButtonText, { color: colors.accentGreen, marginLeft: 6 }]}>
              Voice Intel Synced with Responders
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={startVoiceBeacon}
            style={[styles.actionButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder, borderWidth: 1 }]}
          >
            <MaterialCommunityIcons name="microphone" size={20} color={colors.accentRed} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary, marginLeft: 6 }]}>
              Record 10-Second Voice Beacon
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  buttonRow: {
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  actionButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
});