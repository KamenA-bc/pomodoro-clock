/**
 * Notification & audio utilities for the Pomodoro Timer.
 */

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
            icon: '/vite.svg',
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
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
            gain.gain.setValueAtTime(0.4, startTime + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;

        // Three ascending tones
        playTone(523.25, now, 0.2);        // C5
        playTone(659.25, now + 0.22, 0.2); // E5
        playTone(783.99, now + 0.44, 0.3); // G5

        // Repeat the chime after a short pause
        playTone(523.25, now + 0.9, 0.2);
        playTone(659.25, now + 1.12, 0.2);
        playTone(783.99, now + 1.34, 0.3);

        // Close AudioContext after the sound finishes
        setTimeout(() => ctx.close(), 2500);
    } catch (err) {
        console.warn('Audio playback failed:', err);
    }
}
