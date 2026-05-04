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
  const activeMs = calculateActiveMs(
    session.started_at,
    session.stopped_at ?? Date.now(),
    session.events
  )
  const summary = session.summary ?? ''

  return (
    <tr
      role="row"
      className={cn(
        'cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/30',
        selected && 'border-l-2 border-l-emerald-500/60 bg-emerald-950/20'
      )}
      onClick={onClick}
    >
      <td className="px-4 py-3 text-xs text-foreground/90">{date}</td>
      <td
        className="px-4 py-3 text-xs text-emerald-400/85"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {formatDuration(activeMs)}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground/85" data-testid="summary">
        {truncate(summary)}
      </td>
    </tr>
  )
}
