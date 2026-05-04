import type { SessionDetail } from '@shared/types'
import { formatDuration, calculateActiveMs } from '@shared/utils/time'
import { cn } from '@renderer/lib/utils'

interface SessionRowProps {
  session: SessionDetail
  selected: boolean
  onClick: () => void
}

function truncate(text: string, max = 60): string {
  return text.length <= max ? text : text.slice(0, max) + '…'
}

export function SessionRow({ session, selected, onClick }: SessionRowProps) {
  const date = new Date(session.started_at).toISOString().slice(0, 10)
  const activeMs = calculateActiveMs(session.started_at, session.stopped_at ?? Date.now(), session.events)
  const summary = session.summary ?? ''

  return (
    <tr
      role="row"
      className={cn(
        'cursor-pointer border-b border-border transition-colors hover:bg-muted/50',
        selected && 'bg-green-900/20 border-l-2 border-l-green-500'
      )}
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm text-foreground">{date}</td>
      <td className="px-4 py-3 font-mono text-sm text-green-400">{formatDuration(activeMs)}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground" data-testid="summary">
        {truncate(summary)}
      </td>
    </tr>
  )
}
