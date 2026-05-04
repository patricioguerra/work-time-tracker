import type { CSSProperties } from 'react'
import { useTimerStore } from './timerStore'
import { formatDuration } from '@shared/utils/time'

const COLOR: Record<string, string> = {
  idle: 'text-muted-foreground',
  running: 'text-green-400',
  paused: 'text-orange-400'
}

const GLOW: Record<string, CSSProperties> = {
  idle: {},
  running: { textShadow: '0 0 32px rgba(74, 222, 128, 0.45)' },
  paused: { textShadow: '0 0 32px rgba(251, 146, 60, 0.45)' }
}

const LABEL: Record<string, string> = {
  idle: 'IDLE',
  running: 'RUNNING',
  paused: 'PAUSED'
}

const BADGE_COLOR: Record<string, string> = {
  idle: 'bg-muted text-muted-foreground',
  running: 'bg-green-900/40 text-green-400 ring-1 ring-green-500/30',
  paused: 'bg-orange-900/40 text-orange-400 ring-1 ring-orange-500/30'
}

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status)
  const elapsedActive = useTimerStore((s) => s.elapsedActive)
  const elapsedPaused = useTimerStore((s) => s.elapsedPaused)

  return (
    <div className="flex flex-col items-center gap-4">
      <span
        className={`rounded-full px-3 py-0.5 text-xs font-semibold tracking-widest ${BADGE_COLOR[status]}`}
      >
        {LABEL[status]}
      </span>

      <div
        className={`font-mono text-8xl font-bold tabular-nums tracking-tight ${COLOR[status]}`}
        style={GLOW[status]}
      >
        {formatDuration(elapsedActive)}
      </div>

      {status === 'paused' && (
        <p className="text-sm text-muted-foreground">
          Paused for{' '}
          <span className="font-mono text-orange-400">{formatDuration(elapsedPaused)}</span>
        </p>
      )}
    </div>
  )
}
