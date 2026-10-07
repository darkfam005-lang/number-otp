/**
 * Audio Synthesizer and Haptic Feedback for Android Mobile Web
 */

// Synthesize pleasant chime using Web Audio API (zero external audio file dependency)
export function playSmsChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second chime tone (880.00 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // AudioContext may be blocked before first user interaction
  }
}

// Trigger haptic vibration on Android phones
export function triggerHaptic(pattern: number | number[] = 50) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // vibration not supported or denied
  }
}

// Helper to extract OTP / Verification codes from text
export function extractOtpCode(text: string): string | null {
  if (!text) return null;
  // Match common patterns: "code: 123456", "is 1234", "OTP is: 948271", "verification code 482931"
  const matches = text.match(/(?:code|otp|pin|passcode|secret|verification code)[\s:=is]+([0-9]{4,8})/i) ||
                  text.match(/\b([0-9]{4,8})\b/);
  return matches ? matches[1] : null;
}
