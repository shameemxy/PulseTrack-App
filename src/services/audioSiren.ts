import { Audio } from 'expo-av';
import { useEmergencyStore } from '../stores/useEmergencyStore';

class AudioSirenService {
  private sound: Audio.Sound | null = null;
  private isConfigured: boolean = false;

  private async configureAudioRouting(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false, // Forces main bottom loudspeaker
      });
      this.isConfigured = true;
    } catch (e) {
      console.warn('[PulseTrack Audio] Audio mode config warning:', e);
    }
  }

  /**
   * Starts the 3000Hz SOS Siren pulse.
   * If Stealth Mode is active, siren is strictly inhibited.
   */
  public async startSiren(): Promise<void> {
    const { isStealthMode, setSirenRinging } = useEmergencyStore.getState();

    // Stealth Mode Safety Interlock
    if (isStealthMode) {
      console.log('[PulseTrack Audio] Stealth mode active. Siren suppressed.');
      return;
    }

    if (!this.isConfigured) {
      await this.configureAudioRouting();
    }

    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      }

      // High-frequency 3000Hz acoustic emergency beacon synthesized tone
      // In production assets/audio/siren_3000hz.mp3 is loaded; here we generate or use remote/local sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0, // Force maximum gain
        }
      );

      this.sound = sound;
      setSirenRinging(true);
    } catch (err) {
      console.warn('[PulseTrack Audio] Siren playback error:', err);
    }
  }

  public async stopSiren(): Promise<void> {
    const { setSirenRinging } = useEmergencyStore.getState();
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (err) {
      console.warn('[PulseTrack Audio] Error stopping siren:', err);
    } finally {
      setSirenRinging(false);
    }
  }
}

export const audioSirenService = new AudioSirenService();
