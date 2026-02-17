/**
 * Notification & audio utilities for the Pomodoro Timer.
 */

// ─── Constants ───────────────────────────────────────────────────────
const NOTIFICATION_ICON = '/vite.svg';

// Audio: note frequencies (Hz)
const NOTE_C5 = 523.25;
const NOTE_E5 = 659.25;
const NOTE_G5 = 783.99;

// Audio: envelope & timing (seconds)
const GAIN_PEAK = 0.4;
const ATTACK_TIME = 0.02;
const RELEASE_TIME = 0.1;
const SHORT_NOTE_DURATION = 0.2;
const LONG_NOTE_DURATION = 0.3;
const NOTE_GAP = 0.22;
const CHIME_REPEAT_DELAY = 0.9;
const AUDIO_CONTEXT_CLOSE_DELAY_MS = 2500;

// ─── Browser Notification Permission ─────────────────────────────────
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
}

// ─── Fire a System Notification ──────────────────────────────────────
export function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: NOTIFICATION_ICON,
        });
    }
}

// ─── Play Alarm Sound (generated via AudioContext) ───────────────────
// A short, pleasant two-tone chime synthesised on the fly — no external
// audio file dependency.
export function playAlarmSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const playTone = (frequency, startTime, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, startTime);

            // Envelope: quick attack, sustain, smooth release
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(GAIN_PEAK, startTime + ATTACK_TIME);
            gain.gain.setValueAtTime(GAIN_PEAK, startTime + duration - RELEASE_TIME);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;

        // Chime 1: three ascending tones (C5 → E5 → G5)
        playTone(NOTE_C5, now, SHORT_NOTE_DURATION);
        playTone(NOTE_E5, now + NOTE_GAP, SHORT_NOTE_DURATION);
        playTone(NOTE_G5, now + NOTE_GAP * 2, LONG_NOTE_DURATION);

        // Chime 2: repeat after a short pause
        const repeat = now + CHIME_REPEAT_DELAY;
        playTone(NOTE_C5, repeat, SHORT_NOTE_DURATION);
        playTone(NOTE_E5, repeat + NOTE_GAP, SHORT_NOTE_DURATION);
        playTone(NOTE_G5, repeat + NOTE_GAP * 2, LONG_NOTE_DURATION);

        // Close AudioContext after the sound finishes
        setTimeout(() => ctx.close(), AUDIO_CONTEXT_CLOSE_DELAY_MS);
    } catch (err) {
        console.warn('Audio playback failed:', err);
    }
}
