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
    return <p className="py-8 text-center text-sm text-muted-foreground">No sessions found.</p>
  }

  return (
    <div className="flex flex-col">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b text-xs text-muted-foreground uppercase">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Duration</th>
            <th className="px-4 py-2">Summary</th>
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
      <div className="mt-4 px-4 text-sm text-muted-foreground">
        Total: <span className="font-mono font-medium">{formatDuration(totalActiveMs)}</span>
      </div>
    </div>
  )
}
