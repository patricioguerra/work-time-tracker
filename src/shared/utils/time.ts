import type { SessionEvent } from '../types'

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function calculateActiveMs(
  startedAt: number,
  stoppedAt: number,
  events: SessionEvent[]
): number {
  let pausedMs = 0
  let pauseStart: number | null = null

  for (const event of events) {
    if (event.type === 'pause') {
      pauseStart = event.occurred_at
    } else if (event.type === 'resume' && pauseStart !== null) {
      pausedMs += event.occurred_at - pauseStart
      pauseStart = null
    }
  }

  if (pauseStart !== null) {
    pausedMs += stoppedAt - pauseStart
  }

  return stoppedAt - startedAt - pausedMs
}

export function dateRangeDefaults(): { from: number; to: number } {
  const to = Date.now()
  const fromDate = new Date(to)
  fromDate.setDate(fromDate.getDate() - 30)
  fromDate.setHours(0, 0, 0, 0)
  return { from: fromDate.getTime(), to }
}
