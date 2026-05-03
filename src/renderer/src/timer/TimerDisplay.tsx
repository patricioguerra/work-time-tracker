import { useTimerStore } from './timerStore'
import { formatDuration } from '@shared/utils/time'

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status)
  const elapsedActive = useTimerStore((s) => s.elapsedActive)
  const elapsedPaused = useTimerStore((s) => s.elapsedPaused)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-mono text-7xl font-bold tabular-nums tracking-tight">
        {formatDuration(elapsedActive)}
      </div>
      {status === 'paused' && (
        <p className="text-sm text-muted-foreground">
          <span>Paused</span>
          {' — '}
          <span>{formatDuration(elapsedPaused)}</span>
        </p>
      )}
    </div>
  )
}
