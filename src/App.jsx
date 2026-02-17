import { Play, Pause, RotateCcw, Zap, Minus, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import useTimer from './hooks/useTimer';

// ─── Layout constants ────────────────────────────────────────────────
const RING_RADIUS = 155;
const RING_STROKE = 4;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_CENTER = RING_SIZE / 2;

// Duration picker
const DURATION_STEP = 5;
const DURATION_MIN = 1;
const DURATION_MAX = 120;

// Grid
const GRID_CELL_SIZE = '60px 60px';

// Background orb sizes
const PRIMARY_ORB_SIZE = '600px';
const SECONDARY_ORB_SIZE = '400px';

export default function App() {
  const {
    minutes, seconds, isRunning, timeLeft, progress,
    durationMinutes, start, pause, reset, setDuration,
  } = useTimer();

  const [showSettings, setShowSettings] = useState(false);
  const isFinished = timeLeft === 0;

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08081a] text-white select-none px-4 overflow-hidden">

      {/* ── Background grid + glow ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(236,72,153,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.35) 1px, transparent 1px)',
            backgroundSize: GRID_CELL_SIZE,
          }}
        />
        {/* Primary orb */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-[2000ms] ${isRunning ? 'opacity-50' : 'opacity-20'
            }`}
          style={{
            width: PRIMARY_ORB_SIZE,
            height: PRIMARY_ORB_SIZE,
            background:
              'radial-gradient(circle, rgba(236,72,153,.3) 0%, rgba(192,132,252,.15) 40%, transparent 70%)',
          }}
        />
        {/* Secondary orb */}
        <div
          className={`absolute bottom-0 left-1/4 rounded-full transition-opacity duration-[2000ms] ${isRunning ? 'opacity-35' : 'opacity-15'
            }`}
          style={{
            width: SECONDARY_ORB_SIZE,
            height: SECONDARY_ORB_SIZE,
            background:
              'radial-gradient(circle, rgba(232,121,249,.25) 0%, rgba(236,72,153,.1) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Card ── */}
      <div
        className={`
          relative z-10 w-full max-w-sm rounded-3xl
          bg-[#110f1f]/85 backdrop-blur-2xl
          border transition-all duration-700
          shadow-2xl
          flex flex-col items-center py-14 px-8
          ${isRunning
            ? 'border-pink-500/30 shadow-pink-800/30'
            : 'border-white/[0.06] shadow-black/50'
          }
        `}
      >
        {/* ── Header badge ── */}
        <div className={`
          flex items-center gap-2 mb-12 px-4 py-1.5 rounded-full
          border transition-colors duration-700
          ${isRunning
            ? 'border-pink-500/25 bg-pink-500/[0.08]'
            : isFinished
              ? 'border-fuchsia-400/30 bg-fuchsia-500/10'
              : 'border-white/[0.08] bg-white/[0.03]'
          }
        `}>
          <Zap className={`w-3.5 h-3.5 transition-colors duration-700 ${isRunning ? 'text-pink-400' : isFinished ? 'text-fuchsia-400' : 'text-zinc-500'
            }`} strokeWidth={2.5} />
          <span className={`text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-700 ${isRunning ? 'text-pink-300' : isFinished ? 'text-fuchsia-300' : 'text-zinc-500'
            }`}>
            {isFinished ? 'Complete' : isRunning ? 'Focusing' : 'Ready'}
          </span>
        </div>

        {/* ── Timer ring + digits ── */}
        <div className="relative flex items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
          {/* SVG ring */}
          <svg
            className="absolute inset-0 -rotate-90"
            width={RING_SIZE}
            height={RING_SIZE}
          >
            {/* Track */}
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(236,72,153,0.08)"
              strokeWidth={RING_STROKE}
            />
            {/* Progress arc */}
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke="url(#neonGrad)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
              style={{
                filter: isRunning
                  ? 'drop-shadow(0 0 10px rgba(236,72,153,.5)) drop-shadow(0 0 20px rgba(192,132,252,.25))'
                  : 'none',
              }}
            />
            <defs>
              <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>

          {/* Digits */}
          <div className="relative flex items-baseline tabular-nums">
            <span
              className={`
                font-mono text-7xl sm:text-8xl font-extralight tracking-tight
                transition-all duration-700
                ${isRunning ? 'text-white drop-shadow-[0_0_25px_rgba(236,72,153,.4)]' : 'text-zinc-300'}
                ${isFinished ? 'animate-pulse text-pink-400 drop-shadow-[0_0_25px_rgba(236,72,153,.5)]' : ''}
              `}
            >
              {minutes}
            </span>
            <span
              className={`
                font-mono text-6xl sm:text-7xl font-extralight mx-1
                transition-all duration-500
                ${isRunning ? 'animate-blink text-pink-400/80' : 'text-zinc-600'}
              `}
            >
              :
            </span>
            <span
              className={`
                font-mono text-7xl sm:text-8xl font-extralight tracking-tight
                transition-all duration-700
                ${isRunning ? 'text-white drop-shadow-[0_0_25px_rgba(236,72,153,.4)]' : 'text-zinc-300'}
                ${isFinished ? 'animate-pulse text-pink-400 drop-shadow-[0_0_25px_rgba(236,72,153,.5)]' : ''}
              `}
            >
              {seconds}
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-4 mt-12">
          {/* Start / Pause */}
          <button
            onClick={isRunning ? pause : start}
            disabled={isFinished}
            className={`
              group flex items-center justify-center
              w-16 h-16 rounded-2xl
              transition-all duration-300 cursor-pointer
              ${isFinished
                ? 'bg-white/[0.04] text-zinc-600 cursor-not-allowed'
                : 'bg-gradient-to-br from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-lg shadow-pink-600/30 hover:shadow-pink-500/40 active:scale-95'
              }
            `}
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              <Pause className="w-6 h-6 transition-transform group-hover:scale-110" />
            ) : (
              <Play className="w-6 h-6 ml-0.5 transition-transform group-hover:scale-110" />
            )}
          </button>

          {/* Reset */}
          <button
            onClick={reset}
            className="
              group flex items-center justify-center
              w-14 h-14 rounded-2xl
              bg-white/[0.05] hover:bg-white/[0.1]
              text-zinc-500 hover:text-zinc-300
              border border-white/[0.06] hover:border-pink-500/25
              transition-all duration-300 active:scale-95
              cursor-pointer
            "
            aria-label="Reset"
          >
            <RotateCcw className="w-[18px] h-[18px] transition-transform group-hover:-rotate-90 duration-300" />
          </button>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings((s) => !s)}
            disabled={isRunning}
            className={`
              group flex items-center justify-center
              w-14 h-14 rounded-2xl
              transition-all duration-300 active:scale-95
              cursor-pointer
              ${isRunning
                ? 'bg-white/[0.03] text-zinc-700 cursor-not-allowed'
                : showSettings
                  ? 'bg-pink-500/15 text-pink-400 border border-pink-500/25'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-500 hover:text-zinc-300 border border-white/[0.06] hover:border-pink-500/25'
              }
            `}
            aria-label="Settings"
          >
            <Settings className="w-[18px] h-[18px] transition-transform group-hover:rotate-45 duration-300" />
          </button>
        </div>

        {/* ── Duration picker ── */}
        {showSettings && !isRunning && (
          <div className="mt-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
              Session length
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDuration(durationMinutes - DURATION_STEP)}
                disabled={durationMinutes <= DURATION_MIN}
                className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] hover:border-pink-500/25 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Decrease duration"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="font-mono text-2xl font-light text-pink-300 w-20 text-center tabular-nums">
                {durationMinutes}<span className="text-sm text-zinc-500 ml-1">min</span>
              </span>

              <button
                onClick={() => setDuration(durationMinutes + DURATION_STEP)}
                disabled={durationMinutes >= DURATION_MAX}
                className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] hover:border-pink-500/25 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Increase duration"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Preset chips */}
            <div className="flex gap-2 mt-1">
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={`
                    px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                    ${durationMinutes === m
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300 border border-white/[0.04] hover:border-pink-500/20'
                    }
                  `}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Hint text ── */}
        <p className="mt-10 text-[11px] text-zinc-600 text-center leading-relaxed max-w-[240px]">
          {isFinished
            ? 'Session complete — hit reset to go again.'
            : isRunning
              ? 'Timer runs in background — switch tabs freely Tsveti.'
              : showSettings
                ? 'Adjust your session length above.'
                : `Start a ${durationMinutes}-minute deep focus session.`}
        </p>
      </div>
    </div>
  );
}
