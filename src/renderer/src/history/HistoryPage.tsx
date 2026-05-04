import { useHistory } from './useHistory'
import { SessionList } from './SessionList'
import { SessionDetail } from './SessionDetail'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'

export function HistoryPage() {
  const { sessions, selectedId, from, to, setRange, selectSession } = useHistory()

  const toDateValue = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  const fromMs = (dateStr: string) => new Date(dateStr).getTime()

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-end gap-4 rounded-lg border border-border bg-card p-3">
        <div className="space-y-1">
          <Label htmlFor="from" className="text-xs text-muted-foreground">From</Label>
          <Input
            id="from"
            type="date"
            value={toDateValue(from)}
            onChange={(e) => setRange(fromMs(e.target.value), to)}
            className="w-36"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to" className="text-xs text-muted-foreground">To</Label>
          <Input
            id="to"
            type="date"
            value={toDateValue(to)}
            onChange={(e) => setRange(from, fromMs(e.target.value))}
            className="w-36"
          />
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-auto rounded border border-border">
          <SessionList
            sessions={sessions}
            selectedId={selectedId}
            onSelect={selectSession}
          />
        </div>
        {selectedId !== null && (
          <div className="w-80 overflow-auto rounded border border-border">
            <SessionDetail sessionId={selectedId} />
          </div>
        )}
      </div>
    </div>
  )
}
