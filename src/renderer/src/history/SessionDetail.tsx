import { useEffect, useState } from 'react'
import type { SessionDetail as ISessionDetail } from '@shared/types'
import { formatDuration, calculateActiveMs } from '@shared/utils/time'
import { Badge } from '@renderer/components/ui/badge'

interface SessionDetailProps {
  sessionId: number
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const [detail, setDetail] = useState<ISessionDetail | null>(null)

  useEffect(() => {
    window.api.history.getDetail(sessionId).then(setDetail)
  }, [sessionId])

  if (!detail) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>

  const activeMs = calculateActiveMs(
    detail.started_at,
    detail.stopped_at ?? Date.now(),
    detail.events
  )
  const pausedMs = (detail.stopped_at ?? Date.now()) - detail.started_at - activeMs

  const fmt = (ms: number) => new Date(ms).toLocaleTimeString()

  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="flex gap-4 text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Start:</span> {fmt(detail.started_at)}
        </div>
        <div>
          <span className="font-medium text-foreground">Stop:</span>{' '}
          {detail.stopped_at ? fmt(detail.stopped_at) : '—'}
        </div>
      </div>

      <div className="flex gap-4">
        <Badge className="bg-green-900/40 text-green-400 ring-1 ring-green-500/30 hover:bg-green-900/40">
          Active: {formatDuration(activeMs)}
        </Badge>
        <Badge variant="outline">Paused: {formatDuration(pausedMs)}</Badge>
      </div>

      {detail.events.length > 0 && (
        <div>
          <p className="mb-1 font-medium">Events</p>
          <ul className="space-y-1 text-muted-foreground">
            {detail.events.map((e) => (
              <li key={e.id}>
                <span className="capitalize">{e.type}</span> —{' '}
                {new Date(e.occurred_at).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1 font-medium">Summary</p>
        <p className="whitespace-pre-wrap text-muted-foreground">{detail.summary}</p>
      </div>
    </div>
  )
}
