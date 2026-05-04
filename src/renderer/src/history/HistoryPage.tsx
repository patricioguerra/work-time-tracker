import { CalendarDays } from 'lucide-react'
import { useHistory } from './useHistory'
import { SessionList } from './SessionList'
import { SessionDetail } from './SessionDetail'

export function HistoryPage() {
  const { sessions, selectedId, from, to, setRange, selectSession } = useHistory()

  const toDateValue = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  const fromMs = (dateStr: string) => new Date(dateStr).getTime()

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      {/* Date range filter */}
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3.5 py-2.5">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
              From
            </span>
            <input
              id="from"
              type="date"
              value={toDateValue(from)}
              onChange={(e) => setRange(fromMs(e.target.value), to)}
              className="h-7 rounded border border-border/50 bg-secondary/50 px-2 text-xs text-foreground/90 transition-colors focus:border-primary/35 focus:bg-secondary/70 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>
          <span className="text-border/60 text-[10px]">—</span>
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
              To
            </span>
            <input
              id="to"
              type="date"
              value={toDateValue(to)}
              onChange={(e) => setRange(from, fromMs(e.target.value))}
              className="h-7 rounded border border-border/50 bg-secondary/50 px-2 text-xs text-foreground/90 transition-colors focus:border-primary/35 focus:bg-secondary/70 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>
        </div>
      </div>

      {/* Sessions layout */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        <div className="flex-1 overflow-auto rounded-lg border border-border/50 bg-card/25">
          <SessionList sessions={sessions} selectedId={selectedId} onSelect={selectSession} />
        </div>
        {selectedId !== null && (
          <div className="w-72 overflow-auto rounded-lg border border-border/50 bg-card/25">
            <SessionDetail sessionId={selectedId} />
          </div>
        )}
      </div>
    </div>
  )
}
