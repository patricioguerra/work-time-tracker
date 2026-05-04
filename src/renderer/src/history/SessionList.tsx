import type { SessionDetail } from '@shared/types'
import { SessionRow } from './SessionRow'
import { calculateActiveMs, formatDuration } from '@shared/utils/time'

interface SessionListProps {
  sessions: SessionDetail[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function SessionList({ sessions, selectedId, onSelect }: SessionListProps) {
  const totalActiveMs = sessions.reduce(
    (sum, s) => sum + calculateActiveMs(s.started_at, s.stopped_at ?? Date.now(), s.events),
    0
  )

  if (sessions.length === 0) {
    return (
      <p className="py-10 text-center text-xs tracking-wide text-muted-foreground/40">
        No sessions found
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
              Date
            </th>
            <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
              Duration
            </th>
            <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
              Summary
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              selected={selectedId === session.id}
              onClick={() => onSelect(session.id)}
            />
          ))}
        </tbody>
      </table>
      <div className="border-t border-border/30 px-4 py-3 text-[11px] text-muted-foreground/40">
        Total:{' '}
        <span
          className="font-mono text-emerald-400/80"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {formatDuration(totalActiveMs)}
        </span>
      </div>
    </div>
  )
}
