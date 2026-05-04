import { useEffect, useState } from 'react'
import type { SessionDetail as ISessionDetail } from '@shared/types'
import { formatDuration, calculateActiveMs } from '@shared/utils/time'

interface SessionDetailProps {
  sessionId: number
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const [detail, setDetail] = useState<ISessionDetail | null>(null)

  useEffect(() => {
    window.api.history.getDetail(sessionId).then(setDetail)
  }, [sessionId])

  if (!detail) {
    return <div className="p-4 text-xs text-muted-foreground/40">Loading…</div>
  }

  const activeMs = calculateActiveMs(
    detail.started_at,
    detail.stopped_at ?? Date.now(),
    detail.events
  )
  const pausedMs = (detail.stopped_at ?? Date.now()) - detail.started_at - activeMs

  const fmt = (ms: number) => new Date(ms).toLocaleTimeString()

  return (
    <div className="space-y-4 p-4 text-xs">
      {/* Time range */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
          Time Range
        </p>
        <div className="flex gap-4 text-muted-foreground/85">
          <span>
            <span className="text-foreground/80">Start</span> {fmt(detail.started_at)}
          </span>
          <span>
            <span className="text-foreground/80">Stop</span>{' '}
            {detail.stopped_at ? fmt(detail.stopped_at) : '—'}
          </span>
        </div>
      </div>

      {/* Durations */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
          Duration
        </p>
        <div className="flex gap-3">
          <span className="rounded border border-emerald-500/20 bg-emerald-950/25 px-2 py-0.5 text-emerald-400/80">
            <span
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {formatDuration(activeMs)}
            </span>{' '}
            active
          </span>
          <span className="rounded border border-border/40 bg-secondary/30 px-2 py-0.5 text-muted-foreground/80">
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatDuration(pausedMs)}
            </span>{' '}
            paused
          </span>
        </div>
      </div>

      {/* Events */}
      {detail.events.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
            Events
          </p>
          <ul className="space-y-1 text-muted-foreground/85">
            {detail.events.map((e) => (
              <li key={e.id} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-border" />
                <span className="capitalize">{e.type}</span>
                <span className="text-muted-foreground/45">·</span>
                <span>{new Date(e.occurred_at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
          Summary
        </p>
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground/90">
          {detail.summary}
        </p>
      </div>
    </div>
  )
}
