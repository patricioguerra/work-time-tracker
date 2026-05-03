import type { Session } from '@shared/types'
import { formatDuration, calculateActiveMs } from '@shared/utils/time'
import { cn } from '@renderer/lib/utils'

interface SessionRowProps {
  session: Session
  selected: boolean
  onClick: () => void
}

function truncate(text: string, max = 60): string {
  return text.length <= max ? text : text.slice(0, max) + '…'
}

export function SessionRow({ session, selected, onClick }: SessionRowProps) {
  const date = new Date(session.started_at).toISOString().slice(0, 10)
  const activeMs = calculateActiveMs(session.started_at, session.stopped_at ?? Date.now(), [])
  const summary = session.summary ?? ''

  return (
    <tr
      role="row"
      className={cn(
        'cursor-pointer border-b transition-colors hover:bg-muted/50',
        selected && 'bg-muted'
      )}
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm">{date}</td>
      <td className="px-4 py-3 font-mono text-sm">{formatDuration(activeMs)}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground" data-testid="summary">
        {truncate(summary)}
      </td>
    </tr>
  )
}
