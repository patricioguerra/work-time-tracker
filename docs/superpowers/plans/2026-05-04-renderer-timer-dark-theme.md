# Renderer: Timer Tick Fix + Dark Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the frozen timer display (add a 1-second local tick in the renderer) and redesign the UI with a dark developer-tool aesthetic (near-black background, status-driven neon colors, larger timer, glow effects).

**Architecture:** The Zustand timer store currently holds a stale snapshot of `elapsedActive`. Add a `tick()` action that recomputes it from `startedAt` and `elapsedPaused` — both already in the store. `useTimer` starts a `setInterval(tick, 1000)` while `status === 'running'`. The dark theme replaces CSS variables in `index.css`; components get status-driven Tailwind classes and inline glow styles. No new dependencies needed.

**Tech Stack:** React, Zustand, Tailwind CSS, shadcn/ui, Vitest + @testing-library/react

---

## File Map

| File | Change |
|---|---|
| `src/renderer/src/timer/timerStore.ts` | Add `tick()` action + `tick` to interface |
| `src/renderer/src/timer/timerStore.test.ts` | Add tests for `tick()` |
| `src/renderer/src/timer/useTimer.ts` | Add `setInterval(tick, 1000)` while running |
| `src/renderer/src/index.css` | Replace light CSS vars with dark theme + scrollbar styles |
| `src/renderer/src/timer/TimerDisplay.tsx` | Status colors, glow, status badge, larger font |
| `src/renderer/src/timer/TimerControls.tsx` | Status-aware button colors |
| `src/renderer/src/App.tsx` | Dark tab bar |
| `src/renderer/src/history/SessionRow.tsx` | Dark row with green selected accent |
| `src/renderer/src/history/SessionList.tsx` | Dark header |
| `src/renderer/src/history/SessionDetail.tsx` | Green active badge |
| `src/renderer/src/history/HistoryPage.tsx` | Dark filter bar |

---

### Task 1: Add `tick()` to timerStore — test first

**Files:**
- Modify: `src/renderer/src/timer/timerStore.ts`
- Modify: `src/renderer/src/timer/timerStore.test.ts`

- [ ] **Step 1: Write failing tests for tick()**

Open `src/renderer/src/timer/timerStore.test.ts`. The file already has a `makeState` helper and `beforeEach` that resets the store. Add a new `describe` block after the existing ones:

```ts
describe('tick', () => {
  it('updates elapsedActive when running', () => {
    const startedAt = Date.now() - 5000
    useTimerStore.setState({
      status: 'running',
      startedAt,
      elapsedActive: 0,
      elapsedPaused: 1000,
      pausedAt: null
    })

    act(() => {
      useTimerStore.getState().tick()
    })

    const { elapsedActive } = useTimerStore.getState()
    // 5000ms elapsed, 1000ms was paused → ~4000ms active
    expect(elapsedActive).toBeGreaterThanOrEqual(3800)
    expect(elapsedActive).toBeLessThanOrEqual(4200)
  })

  it('does not update elapsedActive when paused', () => {
    useTimerStore.setState({
      status: 'paused',
      startedAt: Date.now() - 5000,
      elapsedActive: 3000,
      elapsedPaused: 2000,
      pausedAt: Date.now()
    })

    act(() => {
      useTimerStore.getState().tick()
    })

    expect(useTimerStore.getState().elapsedActive).toBe(3000)
  })

  it('does not update elapsedActive when idle', () => {
    act(() => {
      useTimerStore.getState().tick()
    })
    expect(useTimerStore.getState().elapsedActive).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose src/renderer/src/timer/timerStore.test.ts
```

Expected: 3 new tests fail with "tick is not a function" or similar.

- [ ] **Step 3: Add `tick` to timerStore**

Open `src/renderer/src/timer/timerStore.ts`. The full updated file:

```ts
import { create } from 'zustand'
import type { TimerState } from '@shared/types'

interface TimerStore extends TimerState {
  applyState: (state: TimerState) => void
  syncFromMain: () => Promise<() => void>
  tick: () => void
}

export const useTimerStore = create<TimerStore>((set) => ({
  status: 'idle',
  startedAt: null,
  elapsedActive: 0,
  elapsedPaused: 0,
  pausedAt: null,

  applyState: (state: TimerState) => set(state),

  syncFromMain: async () => {
    const initial = await window.api.timer.getState()
    set(initial)
    const unsub = window.api.timer.onStateChange((state) => set(state))
    return unsub
  },

  tick: () =>
    set((s) => {
      if (s.status !== 'running' || s.startedAt === null) return {}
      return { elapsedActive: Date.now() - s.startedAt - s.elapsedPaused }
    })
}))
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose src/renderer/src/timer/timerStore.test.ts
```

Expected: all tests pass (3 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/timer/timerStore.ts src/renderer/src/timer/timerStore.test.ts
git commit -m "feat: add tick() to timerStore for real-time elapsed update"
```

---

### Task 2: Wire tick interval in useTimer

**Files:**
- Modify: `src/renderer/src/timer/useTimer.ts`

The test for this would require faking `setInterval` in a component test — not worth the complexity. The tick action is already tested; this wiring is trivial.

- [ ] **Step 1: Update useTimer.ts**

Full replacement of `src/renderer/src/timer/useTimer.ts`:

```ts
import { useEffect, useRef } from 'react'
import { useTimerStore } from './timerStore'

export function useTimer() {
  const unsubRef = useRef<(() => void) | null>(null)
  const syncFromMain = useTimerStore((s) => s.syncFromMain)
  const tick = useTimerStore((s) => s.tick)
  const status = useTimerStore((s) => s.status)

  useEffect(() => {
    let cancelled = false
    syncFromMain().then((unsub) => {
      if (!cancelled) unsubRef.current = unsub
    })
    return () => {
      cancelled = true
      unsubRef.current?.()
    }
  }, [syncFromMain])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status, tick])

  return {
    start: () => window.api.timer.start(),
    pause: () => window.api.timer.pause(),
    resume: () => window.api.timer.resume(),
    stop: (summary: string) => window.api.timer.stop(summary)
  }
}
```

- [ ] **Step 2: Run all renderer tests**

```bash
npm test -- --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/timer/useTimer.ts
git commit -m "fix: start 1s tick interval in useTimer while timer is running"
```

---

### Task 3: Dark theme CSS variables

**Files:**
- Modify: `src/renderer/src/index.css`

- [ ] **Step 1: Replace index.css**

Full replacement of `src/renderer/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 6%;
    --foreground: 0 0% 95%;
    --card: 0 0% 10%;
    --card-foreground: 0 0% 95%;
    --primary: 142 71% 45%;
    --primary-foreground: 0 0% 5%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 80%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 50%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 95%;
    --destructive: 0 72% 55%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 18%;
    --input: 0 0% 18%;
    --ring: 142 71% 45%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: hsl(0 0% 25%);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: hsl(0 0% 35%);
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test -- --reporter=verbose
```

Expected: all pass (CSS changes don't affect logic tests).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/index.css
git commit -m "feat: apply dark theme CSS variables"
```

---

### Task 4: Redesign TimerDisplay

**Files:**
- Modify: `src/renderer/src/timer/TimerDisplay.tsx`

- [ ] **Step 1: Replace TimerDisplay.tsx**

```tsx
import type { CSSProperties } from 'react'
import { useTimerStore } from './timerStore'
import { formatDuration } from '@shared/utils/time'

const COLOR: Record<string, string> = {
  idle: 'text-muted-foreground',
  running: 'text-green-400',
  paused: 'text-orange-400'
}

const GLOW: Record<string, CSSProperties> = {
  idle: {},
  running: { textShadow: '0 0 32px rgba(74, 222, 128, 0.45)' },
  paused: { textShadow: '0 0 32px rgba(251, 146, 60, 0.45)' }
}

const LABEL: Record<string, string> = {
  idle: 'IDLE',
  running: 'RUNNING',
  paused: 'PAUSED'
}

const BADGE_COLOR: Record<string, string> = {
  idle: 'bg-muted text-muted-foreground',
  running: 'bg-green-900/40 text-green-400 ring-1 ring-green-500/30',
  paused: 'bg-orange-900/40 text-orange-400 ring-1 ring-orange-500/30'
}

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status)
  const elapsedActive = useTimerStore((s) => s.elapsedActive)
  const elapsedPaused = useTimerStore((s) => s.elapsedPaused)

  return (
    <div className="flex flex-col items-center gap-4">
      <span
        className={`rounded-full px-3 py-0.5 text-xs font-semibold tracking-widest ${BADGE_COLOR[status]}`}
      >
        {LABEL[status]}
      </span>

      <div
        className={`font-mono text-8xl font-bold tabular-nums tracking-tight ${COLOR[status]}`}
        style={GLOW[status]}
      >
        {formatDuration(elapsedActive)}
      </div>

      {status === 'paused' && (
        <p className="text-sm text-muted-foreground">
          Paused for{' '}
          <span className="font-mono text-orange-400">{formatDuration(elapsedPaused)}</span>
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --reporter=verbose src/renderer/src/timer/TimerDisplay.test.tsx
```

Expected: existing snapshot/render tests pass (the component still renders, status still visible).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/timer/TimerDisplay.tsx
git commit -m "feat: redesign TimerDisplay with status colors and glow"
```

---

### Task 5: History + App dark styling

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/history/SessionRow.tsx`
- Modify: `src/renderer/src/history/SessionList.tsx`
- Modify: `src/renderer/src/history/SessionDetail.tsx`
- Modify: `src/renderer/src/history/HistoryPage.tsx`

No test changes — styling only. Existing component tests still pass.

- [ ] **Step 1: Update App.tsx**

Replace the `TabsList` className to add a dark background for the tab bar:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { TimerPage } from '@renderer/timer/TimerPage'
import { HistoryPage } from '@renderer/history/HistoryPage'

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <Tabs defaultValue="timer" className="flex flex-1 flex-col">
        <TabsList className="shrink-0 rounded-none border-b bg-card px-4">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="timer" className="flex-1 overflow-auto">
          <TimerPage />
        </TabsContent>
        <TabsContent value="history" className="flex-1 overflow-auto">
          <HistoryPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Update SessionRow.tsx**

Replace selected state with green accent instead of muted:

```tsx
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
```

- [ ] **Step 3: Update SessionList.tsx**

Make the table header darker:

```tsx
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
          <tr className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
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
        Total:{' '}
        <span className="font-mono font-medium text-green-400">{formatDuration(totalActiveMs)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update SessionDetail.tsx**

Color the active badge green:

```tsx
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
```

- [ ] **Step 5: Update HistoryPage.tsx**

Dark card for the filter bar:

```tsx
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
```

- [ ] **Step 6: Run all tests**

```bash
npm test -- --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/history/SessionRow.tsx src/renderer/src/history/SessionList.tsx src/renderer/src/history/SessionDetail.tsx src/renderer/src/history/HistoryPage.tsx
git commit -m "feat: dark theme styling for history and app shell"
```

---

### Task 6: Final build verification

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 2: Run the app**

```bash
./release/linux-unpacked/work-time-tracker
```

Verify:
1. Dark background loads immediately (no flash of white)
2. Click Start → timer display turns green, starts counting up every second
3. Click Pause → display turns orange, elapsed time freezes
4. Click Resume → back to green, counting resumes
5. History tab → dark rows, green duration values, date filter has dark card background
6. Close window → app keeps running (handled by main-process plan)

- [ ] **Step 3: Final commit if needed**

If any minor fixes were made during verification:

```bash
git add -p
git commit -m "fix: post-verification tweaks"
```
