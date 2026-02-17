import { useState, useEffect, useRef, useCallback } from 'react';
import {
    requestNotificationPermission,
    sendNotification,
    playAlarmSound,
} from '../utils/notifications';

// ─── Constants ───────────────────────────────────────────────────────
const DEFAULT_DURATION_MINUTES = 25;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const STORAGE_KEY = 'pomodoro_timer_state';
const PAD_LENGTH = 2;
const PAD_CHAR = '0';

// ─── localStorage helpers ────────────────────────────────────────────
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // storage full or unavailable — silent fail
    }
}

function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // noop
    }
}

// ─── Hook ────────────────────────────────────────────────────────────
export default function useTimer() {
    const workerRef = useRef(null);
    const hasFinishedRef = useRef(false);

    // Track the chosen duration in minutes (user-configurable)
    const [durationMinutes, setDurationMinutes] = useState(() => {
        const saved = loadState();
        return saved?.durationMinutes ?? DEFAULT_DURATION_MINUTES;
    });

    const totalSeconds = durationMinutes * SECONDS_PER_MINUTE;

    // Initialise from persisted state (if any)
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = loadState();
        if (saved?.isRunning && saved?.targetEndTime) {
            const remaining = Math.round(
                (saved.targetEndTime - Date.now()) / MS_PER_SECOND
            );
            return remaining > 0 ? remaining : 0;
        }
        return saved?.timeLeft ?? DEFAULT_DURATION_MINUTES * SECONDS_PER_MINUTE;
    });

    const [isRunning, setIsRunning] = useState(() => {
        const saved = loadState();
        if (saved?.isRunning && saved?.targetEndTime) {
            const remaining = Math.round(
                (saved.targetEndTime - Date.now()) / MS_PER_SECOND
            );
            return remaining > 0;
        }
        return false;
    });

    const [targetEndTime, setTargetEndTime] = useState(() => {
        const saved = loadState();
        if (saved?.isRunning && saved?.targetEndTime) {
            const remaining = Math.round(
                (saved.targetEndTime - Date.now()) / MS_PER_SECOND
            );
            if (remaining > 0) return saved.targetEndTime;
        }
        return null;
    });

    // ── Spawn Web Worker once ──────────────────────────────────────────
    useEffect(() => {
        const worker = new Worker(
            new URL('../workers/timer.worker.js', import.meta.url),
            { type: 'module' }
        );
        workerRef.current = worker;

        worker.onmessage = () => {
            // 'tick' — recalculate remaining from the timestamp
            setTargetEndTime((end) => {
                if (!end) return end;
                const remaining = Math.round((end - Date.now()) / MS_PER_SECOND);

                if (remaining <= 0) {
                    setTimeLeft(0);
                    setIsRunning(false);
                    setTargetEndTime(null);

                    // Only fire alarm once per session
                    if (!hasFinishedRef.current) {
                        hasFinishedRef.current = true;
                        playAlarmSound();
                        sendNotification(
                            'Pomodoro Complete! 🎉',
                            'Great work! Time to take a break.'
                        );
                    }

                    worker.postMessage({ type: 'stop' });
                    clearState();
                    return null;
                }

                setTimeLeft(remaining);
                return end;
            });
        };

        return () => worker.terminate();
    }, []);

    // ── Auto-resume after reload ───────────────────────────────────────
    useEffect(() => {
        if (isRunning && workerRef.current) {
            workerRef.current.postMessage({ type: 'start' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run only on mount

    // ── Persist state on every change ──────────────────────────────────
    useEffect(() => {
        saveState({ timeLeft, isRunning, targetEndTime, durationMinutes });
    }, [timeLeft, isRunning, targetEndTime, durationMinutes]);

    // ── Update document.title ──────────────────────────────────────────
    useEffect(() => {
        const mins = String(Math.floor(timeLeft / SECONDS_PER_MINUTE)).padStart(
            PAD_LENGTH,
            PAD_CHAR
        );
        const secs = String(timeLeft % SECONDS_PER_MINUTE).padStart(
            PAD_LENGTH,
            PAD_CHAR
        );

        if (isRunning) {
            document.title = `(${mins}:${secs}) Focus — Pomodoro`;
        } else if (timeLeft === 0) {
            document.title = 'Break Time! — Pomodoro';
        } else {
            document.title = `${mins}:${secs} — Pomodoro`;
        }
    }, [timeLeft, isRunning]);

    // ── Controls ───────────────────────────────────────────────────────
    const start = useCallback(() => {
        requestNotificationPermission();
        hasFinishedRef.current = false;

        const end = Date.now() + timeLeft * MS_PER_SECOND;
        setTargetEndTime(end);
        setIsRunning(true);

        workerRef.current?.postMessage({ type: 'start' });
    }, [timeLeft]);

    const pause = useCallback(() => {
        setIsRunning(false);
        setTargetEndTime(null);
        workerRef.current?.postMessage({ type: 'stop' });
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setTargetEndTime(null);
        setTimeLeft(totalSeconds);
        hasFinishedRef.current = false;
        workerRef.current?.postMessage({ type: 'stop' });
        clearState();
    }, [totalSeconds]);

    // Change duration (only allowed while not running)
    const setDuration = useCallback(
        (newMinutes) => {
            if (isRunning) return;
            const clamped = Math.max(1, Math.min(newMinutes, 120));
            setDurationMinutes(clamped);
            setTimeLeft(clamped * SECONDS_PER_MINUTE);
        },
        [isRunning]
    );

    // ── Derived values ─────────────────────────────────────────────────
    const minutes = String(Math.floor(timeLeft / SECONDS_PER_MINUTE)).padStart(
        PAD_LENGTH,
        PAD_CHAR
    );
    const seconds = String(timeLeft % SECONDS_PER_MINUTE).padStart(
        PAD_LENGTH,
        PAD_CHAR
    );
    const progress = 1 - timeLeft / totalSeconds; // 0 → 1

    return {
        minutes,
        seconds,
        isRunning,
        timeLeft,
        progress,
        durationMinutes,
        start,
        pause,
        reset,
        setDuration,
    };
}
