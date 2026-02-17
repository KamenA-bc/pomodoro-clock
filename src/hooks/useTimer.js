import { useState, useEffect, useRef, useCallback } from 'react';
import {
    requestNotificationPermission,
    sendNotification,
    playAlarmSound,
} from '../utils/notifications';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const STORAGE_KEY = 'pomodoro_timer_state';

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

    // Initialise from persisted state (if any)
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = loadState();
        if (saved?.isRunning && saved?.targetEndTime) {
            const remaining = Math.round((saved.targetEndTime - Date.now()) / 1000);
            return remaining > 0 ? remaining : 0;
        }
        return saved?.timeLeft ?? POMODORO_DURATION;
    });

    const [isRunning, setIsRunning] = useState(() => {
        const saved = loadState();
        if (saved?.isRunning && saved?.targetEndTime) {
            const remaining = Math.round((saved.targetEndTime - Date.now()) / 1000);
            return remaining > 0;
        }
        return false;
    });

    const [targetEndTime, setTargetEndTime] = useState(() => {
        const saved = loadState();
        if (saved?.isRunning && saved?.targetEndTime) {
            const remaining = Math.round((saved.targetEndTime - Date.now()) / 1000);
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
                const remaining = Math.round((end - Date.now()) / 1000);

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
        saveState({ timeLeft, isRunning, targetEndTime });
    }, [timeLeft, isRunning, targetEndTime]);

    // ── Update document.title ──────────────────────────────────────────
    useEffect(() => {
        const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const secs = String(timeLeft % 60).padStart(2, '0');

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

        const end = Date.now() + timeLeft * 1000;
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
        setTimeLeft(POMODORO_DURATION);
        hasFinishedRef.current = false;
        workerRef.current?.postMessage({ type: 'stop' });
        clearState();
    }, []);

    // ── Derived values ─────────────────────────────────────────────────
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    const progress = 1 - timeLeft / POMODORO_DURATION; // 0 → 1

    return { minutes, seconds, isRunning, timeLeft, progress, start, pause, reset };
}
