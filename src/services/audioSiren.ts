import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEmergencyStore } from '../stores/useEmergencyStore';

class AudioSirenService {
  private player: AudioPlayer | null = null;
  private isConfigured: boolean = false;

  private async configureAudioRouting(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false, // Forces main bottom loudspeaker
        allowsRecording: false,
        interruptionMode: 'doNotMix',
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
      if (this.player) {
        this.player.pause();
        this.player.remove();
        this.player = null;
      }

      // Note: iOS AVPlayer does not play .ogg natively; swap to a local .mp3/.wav in assets/ for iOS siren audio
      const player = createAudioPlayer({
        uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
      });

      player.loop = true;
      player.volume = 1.0; // Force maximum gain
      player.play();

      this.player = player;
      setSirenRinging(true);
    } catch (err) {
      console.warn('[PulseTrack Audio] Siren playback error:', err);
    }
  }

  public async stopSiren(): Promise<void> {
    const { setSirenRinging } = useEmergencyStore.getState();
    try {
      if (this.player) {
        this.player.pause();
        this.player.remove();
        this.player = null;
      }
    } catch (err) {
      console.warn('[PulseTrack Audio] Error stopping siren:', err);
    } finally {
      setSirenRinging(false);
    }
  }
}

export const audioSirenService = new AudioSirenService();