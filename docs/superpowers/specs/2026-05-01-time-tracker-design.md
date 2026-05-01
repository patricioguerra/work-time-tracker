# Work Time Tracker — Design Spec

**Date:** 2026-05-01

---

## Overview

Desktop time tracking application for Linux and macOS. The user can start, pause, and stop a work session. When stopping, they are prompted for a daily summary. A second tab shows session history filterable by date range, with drill-down to full session detail.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron |
| Frontend | React + TypeScript |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | SQLite via `better-sqlite3` |
| State (renderer) | Zustand |
| State (main) | TimerService class |
| Build | electron-vite |
| Testing | Vitest + @testing-library/react |

---

## Architecture

### Pattern: Feature-based modular

The application is split into two OS-level processes:

**Main process (Node.js):** Owns the timer state and the SQLite database. The timer continues running even when the renderer window is closed. The system tray is managed here and reflects timer state in real time.

**Renderer process (React):** Displays the UI. Never accesses Node.js or SQLite directly. All communication goes through IPC via `contextBridge` in `preload.ts`. `nodeIntegration` is `false`.

**System tray:** Managed in the main process. Provides start/pause/resume/stop without opening the window. Tooltip shows elapsed time updated every second.

### IPC contract (preload.ts exposes to renderer)

```typescript
window.api = {
  timer: {
    start: () => Promise<void>,
    pause: () => Promise<void>,
    resume: () => Promise<void>,
    stop: (summary: string) => Promise<void>,
    getState: () => Promise<TimerState>,
    onStateChange: (cb: (state: TimerState) => void) => () => void,
  },
  history: {
    query: (from: number, to: number) => Promise<Session[]>,
    getDetail: (sessionId: number) => Promise<SessionDetail>,
  }
}
```

---

## Data Model (SQLite)

```sql
CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,   -- Unix timestamp ms
  stopped_at INTEGER,            -- NULL if active
  summary    TEXT                -- filled on stop
);

CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES sessions(id),
  type        TEXT NOT NULL,     -- 'pause' | 'resume'
  occurred_at INTEGER NOT NULL   -- Unix timestamp ms
);
```

Timestamps stored as Unix milliseconds (INTEGER) for easy range queries and duration calculations.

---

## Features

### Timer (Tab 1)

States: `idle` → `running` → `paused` → `stopped`

- **idle:** Shows Start button
- **running:** Shows elapsed active time (excludes pause time), Pause and Stop buttons
- **paused:** Shows elapsed time frozen, total paused time, Resume and Stop buttons
- **Stop flow:** Opens a modal/dialog requiring a non-empty summary text before confirming. On confirm, saves session + summary to DB and resets to idle.

Timer state lives in the main process (`TimerService`). The renderer subscribes to state changes via `onStateChange` IPC listener and syncs into Zustand on mount.

### History (Tab 2)

- Date range picker (from / to), defaults to last 30 days
- List of sessions showing: date, total active duration, summary truncated to ~60 chars
- Total hours for the selected period shown at the bottom
- Clicking a row opens a detail panel (drawer or inline expansion) showing:
  - Start time, stop time
  - Each pause/resume event with timestamp
  - Active time vs paused time breakdown
  - Full summary text

### System Tray

- Icon reflects state: idle / running / paused (different colors)
- Tooltip: elapsed active time, updated every second while running
- Context menu: Start / Pause / Resume / Stop / Open window / Quit

---

## Folder Structure

```
src/
├── main/
│   ├── index.ts                 # Entry point, BrowserWindow, Tray setup
│   ├── timer/
│   │   ├── TimerService.ts      # Timer state machine + logic
│   │   └── timer.ipc.ts         # IPC handlers for timer
│   ├── history/
│   │   └── history.ipc.ts       # IPC handlers for history queries
│   ├── db/
│   │   ├── database.ts          # SQLite connection + migrations
│   │   ├── SessionRepository.ts
│   │   └── EventRepository.ts
│   └── tray/
│       └── TrayManager.ts
│
├── preload/
│   └── index.ts                 # contextBridge API
│
└── renderer/
    ├── main.tsx
    ├── App.tsx                  # Tabs: Timer | History
    ├── timer/
    │   ├── timerStore.ts        # Zustand store
    │   ├── useTimer.ts
    │   ├── TimerPage.tsx
    │   ├── TimerDisplay.tsx
    │   ├── TimerControls.tsx
    │   └── StopDialog.tsx
    ├── history/
    │   ├── historyStore.ts      # Zustand store
    │   ├── useHistory.ts
    │   ├── HistoryPage.tsx
    │   ├── SessionList.tsx
    │   ├── SessionRow.tsx
    │   └── SessionDetail.tsx
    └── shared/
        ├── components/
        └── utils/
            └── time.ts          # Duration formatting, date range helpers
```

---

## Testing Strategy

- **Vitest** for all unit tests (main process and renderer)
- **@testing-library/react** for component tests
- **SQLite in-memory** (`:memory:`) for repository tests — no DB mocking
- No E2E tests in scope (YAGNI)

### What to test

| Unit | What to verify |
|---|---|
| `TimerService` | State transitions (idle→running→paused→stopped), elapsed time calculation |
| `SessionRepository` | insert, query by date range, update stopped_at + summary |
| `EventRepository` | insert pause/resume events, fetch by session_id |
| `time.ts` utils | Duration formatting, active time calculation from events |
| `timerStore` | State sync from IPC, correct derived values |
| `StopDialog` | Cannot confirm with empty summary |
| `SessionRow` | Renders truncated summary, correct duration display |

---

## Out of Scope (for now)

- System notifications / break reminders
- Data export (CSV, JSON)
- Multiple concurrent timers
- Cloud sync
- Auto-start on login
