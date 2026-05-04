import type { CSSProperties } from 'react'
import { useTimerStore } from './timerStore'
import { formatDuration } from '@shared/utils/time'

const TIME_COLOR: Record<string, string> = {
  idle: 'text-foreground/25',
  running: 'text-emerald-400',
  paused: 'text-amber-400'
}

const TIME_GLOW: Record<string, CSSProperties> = {
  idle: {},
  running: {
    textShadow: '0 0 48px rgba(52, 211, 153, 0.28), 0 0 12px rgba(52, 211, 153, 0.12)'
  },
  paused: {
    textShadow: '0 0 48px rgba(251, 191, 36, 0.28), 0 0 12px rgba(251, 191, 36, 0.12)'
  }
}

const AMBIENT: Record<string, CSSProperties> = {
  idle: {},
  running: {
    background:
      'radial-gradient(ellipse 320px 280px at center, rgba(52, 211, 153, 0.055) 0%, transparent 72%)'
  },
  paused: {
    background:
      'radial-gradient(ellipse 320px 280px at center, rgba(251, 191, 36, 0.055) 0%, transparent 72%)'
  }
}

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-muted-foreground/25',
  running: 'bg-emerald-400',
  paused: 'bg-amber-400'
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'idle',
  running: 'running',
  paused: 'paused'
}

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status)
  const elapsedActive = useTimerStore((s) => s.elapsedActive)
  const elapsedPaused = useTimerStore((s) => s.elapsedPaused)

  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient glow layer */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-all duration-1000"
        style={AMBIENT[status]}
      />

      <div className="flex flex-col items-center gap-5">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${STATUS_DOT[status]} ${status === 'running' ? 'animate-pulse' : ''}`}
          />
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/65 transition-colors duration-300">
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Timer */}
        <div
          className={`tabular-nums transition-colors duration-300 ${TIME_COLOR[status]}`}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: 'clamp(3.5rem, 10vw, 5.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            ...TIME_GLOW[status]
          }}
        >
          {formatDuration(elapsedActive)}
        </div>

        {/* Paused sub-info */}
        <div className="h-4">
          {status === 'paused' && (
            <p className="text-[11px] text-muted-foreground/60">
              paused{' '}
              <span
                className="font-mono text-amber-400/70"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatDuration(elapsedPaused)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
