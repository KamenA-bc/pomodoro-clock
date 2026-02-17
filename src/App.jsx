import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import useTimer from './hooks/useTimer';

export default function App() {
  const { minutes, seconds, isRunning, timeLeft, progress, start, pause, reset } =
    useTimer();

  const isFinished = timeLeft === 0;

  // Progress ring
  const radius = 155;
  const stroke = 4;
  const size = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] text-white select-none px-4 overflow-hidden">

      {/* ── Background grid + glow ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(192,132,252,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Ambient orbs */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-opacity duration-[2000ms] ${isRunning ? 'opacity-40' : 'opacity-15'
            }`}
          style={{
            background:
              'radial-gradient(circle, rgba(217,70,239,.2) 0%, rgba(168,85,247,.12) 40%, transparent 70%)',
          }}
        />
        <div
          className={`absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full transition-opacity duration-[2000ms] ${isRunning ? 'opacity-25' : 'opacity-10'
            }`}
          style={{
            background:
              'radial-gradient(circle, rgba(232,121,249,.15) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Card ── */}
      <div
        className={`
          relative z-10 w-full max-w-sm rounded-3xl
          bg-[#12121e]/80 backdrop-blur-2xl
          border transition-all duration-700
          shadow-2xl
          flex flex-col items-center py-14 px-8
          ${isRunning
            ? 'border-fuchsia-500/20 shadow-fuchsia-900/25'
            : 'border-white/[0.06] shadow-black/50'
          }
        `}
      >
        {/* ── Header badge ── */}
        <div className={`
          flex items-center gap-2 mb-12 px-4 py-1.5 rounded-full
          border transition-colors duration-700
          ${isRunning
            ? 'border-fuchsia-500/20 bg-fuchsia-500/[0.07]'
            : isFinished
              ? 'border-fuchsia-500/30 bg-fuchsia-500/10'
              : 'border-white/[0.08] bg-white/[0.03]'
          }
        `}>
          <Zap className={`w-3.5 h-3.5 transition-colors duration-700 ${isRunning ? 'text-fuchsia-400' : isFinished ? 'text-pink-400' : 'text-zinc-500'
            }`} strokeWidth={2.5} />
          <span className={`text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-700 ${isRunning ? 'text-fuchsia-300' : isFinished ? 'text-pink-300' : 'text-zinc-500'
            }`}>
            {isFinished ? 'Complete' : isRunning ? 'Focusing' : 'Ready'}
          </span>
        </div>

        {/* ── Timer ring + digits ── */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          {/* SVG ring */}
          <svg
            className="absolute inset-0 -rotate-90"
            width={size}
            height={size}
          >
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(217,70,239,0.07)"
              strokeWidth={stroke}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#neonGrad)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
              style={{
                filter: isRunning ? 'drop-shadow(0 0 8px rgba(217,70,239,.4))' : 'none',
              }}
            />
            <defs>
              <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e879f9" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Digits */}
          <div className="relative flex items-baseline tabular-nums">
            <span
              className={`
                font-mono text-7xl sm:text-8xl font-extralight tracking-tight
                transition-all duration-700
                ${isRunning ? 'text-white drop-shadow-[0_0_20px_rgba(217,70,239,.3)]' : 'text-zinc-300'}
                ${isFinished ? 'animate-pulse text-fuchsia-400 drop-shadow-[0_0_20px_rgba(232,121,249,.35)]' : ''}
              `}
            >
              {minutes}
            </span>
            <span
              className={`
                font-mono text-6xl sm:text-7xl font-extralight mx-1
                transition-all duration-500
                ${isRunning ? 'animate-blink text-fuchsia-400/70' : 'text-zinc-600'}
              `}
            >
              :
            </span>
            <span
              className={`
                font-mono text-7xl sm:text-8xl font-extralight tracking-tight
                transition-all duration-700
                ${isRunning ? 'text-white drop-shadow-[0_0_20px_rgba(217,70,239,.3)]' : 'text-zinc-300'}
                ${isFinished ? 'animate-pulse text-fuchsia-400 drop-shadow-[0_0_20px_rgba(232,121,249,.35)]' : ''}
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
                : 'bg-fuchsia-700/80 hover:bg-fuchsia-600/80 text-white shadow-lg shadow-fuchsia-700/20 hover:shadow-fuchsia-600/30 active:scale-95'
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
              border border-white/[0.06] hover:border-fuchsia-500/20
              transition-all duration-300 active:scale-95
              cursor-pointer
            "
            aria-label="Reset"
          >
            <RotateCcw className="w-[18px] h-[18px] transition-transform group-hover:-rotate-90 duration-300" />
          </button>
        </div>

        {/* ── Hint text ── */}
        <p className="mt-10 text-[11px] text-zinc-600 text-center leading-relaxed max-w-[240px]">
          {isFinished
            ? 'Session complete — hit reset to go again.'
            : isRunning
              ? 'Timer runs in background — switch tabs freely.'
              : 'Start a 25-minute deep focus session.'}
        </p>
      </div>
    </div>
  );
}
