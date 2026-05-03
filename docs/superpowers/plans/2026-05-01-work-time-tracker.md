# Work Time Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop Electron time-tracking app with a timer tab, history tab, and system tray integration.

**Architecture:** Main process owns timer state (`TimerService`) and SQLite database; renderer displays UI via IPC through `contextBridge` with `nodeIntegration: false`. `TrayManager` mirrors timer state in the system tray, updating the tooltip every second while running.

**Tech Stack:** Electron 30 + electron-vite 2, React 18 + TypeScript 5, shadcn/ui + Tailwind CSS 3, Zustand 4, SQLite via better-sqlite3, Vitest 1 + @testing-library/react 15

---

## File Map

```
src/
├── shared/
│   ├── types.ts                        # TimerState, Session, SessionEvent, SessionDetail
│   └── utils/
│       └── time.ts                     # formatDuration, calculateActiveMs, dateRangeDefaults
│
├── main/
│   ├── index.ts                        # BrowserWindow + IPC registration + Tray
│   ├── timer/
│   │   ├── TimerService.ts             # State machine + DB persistence
│   │   ├── TimerService.test.ts
│   │   └── timer.ipc.ts                # IPC handlers for timer channel
│   ├── history/
│   │   └── history.ipc.ts              # IPC handlers for history channel
│   ├── db/
│   │   ├── database.ts                 # SQLite open + migrations
│   │   ├── database.test.ts
│   │   ├── SessionRepository.ts
│   │   ├── SessionRepository.test.ts
│   │   ├── EventRepository.ts
│   │   └── EventRepository.test.ts
│   └── tray/
│       └── TrayManager.ts              # System tray icon + menu
│
├── preload/
│   └── index.ts                        # contextBridge API
│
└── renderer/
    ├── index.html
    └── src/
        ├── main.tsx                    # React root
        ├── index.css                   # Tailwind + CSS variables
        ├── test-setup.ts               # @testing-library/jest-dom
        ├── env.d.ts                    # window.api type declaration
        ├── App.tsx                     # Tab container
        ├── lib/
        │   └── utils.ts                # cn() helper
        ├── components/ui/              # shadcn/ui components (button, dialog, tabs, …)
        ├── timer/
        │   ├── timerStore.ts           # Zustand store + IPC sync
        │   ├── timerStore.test.ts
        │   ├── useTimer.ts             # Actions hook
        │   ├── TimerPage.tsx
        │   ├── TimerDisplay.tsx
        │   ├── TimerControls.tsx
        │   └── StopDialog.tsx
        └── history/
            ├── historyStore.ts         # Zustand store
            ├── historyStore.test.ts
            ├── useHistory.ts           # Query hook
            ├── HistoryPage.tsx
            ├── SessionList.tsx
            ├── SessionRow.tsx
            └── SessionDetail.tsx
```

---

## Task 1: Project Scaffolding

**Model:** `claude-haiku-4-5-20251001` — mechanical file creation, no judgment calls

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `vitest.workspace.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.tsx` (placeholder)
- Create: `src/renderer/src/index.css`
- Create: `src/renderer/src/test-setup.ts`
- Create: `src/renderer/src/lib/utils.ts`
- Create: `src/main/index.ts` (placeholder)
- Create: `src/preload/index.ts` (placeholder)
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "work-time-tracker",
  "version": "1.0.0",
  "description": "Desktop time tracking application",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@electron-toolkit/tsconfig": "^1.0.1",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.2",
    "@testing-library/user-event": "^14.5.2",
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "electron": "^30.0.1",
    "electron-builder": "^24.9.1",
    "electron-vite": "^2.1.0",
    "jsdom": "^24.0.0",
    "lucide-react": "^0.376.0",
    "postcss": "^8.4.38",
    "tailwind-merge": "^2.3.0",
    "tailwindcss": "^3.4.3",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared') }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 5: Create tsconfig.node.json**

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "include": [
    "electron.vite.config.*",
    "src/main/**/*",
    "src/preload/**/*",
    "src/shared/**/*",
    "vitest.workspace.ts"
  ],
  "compilerOptions": {
    "composite": true,
    "types": ["electron-vite/node"],
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

- [ ] **Step 6: Create tsconfig.web.json**

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "include": ["src/renderer/src/**/*", "src/shared/**/*"],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@renderer/*": ["src/renderer/src/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

- [ ] **Step 7: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
```

- [ ] **Step 8: Create postcss.config.js**

```javascript
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
```

- [ ] **Step 9: Create vitest.workspace.ts**

```typescript
import { defineWorkspace } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineWorkspace([
  {
    test: {
      name: 'main',
      include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
      environment: 'node',
      alias: { '@shared': resolve(__dirname, 'src/shared') }
    }
  },
  {
    plugins: [react()],
    test: {
      name: 'renderer',
      include: ['src/renderer/src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/renderer/src/test-setup.ts'],
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  }
])
```

Add `"workspace": "./vitest.workspace.ts"` to the `test` key in `vitest.config.ts` if it exists, or the `vitest.workspace.ts` file alone is sufficient — vitest auto-discovers it.

- [ ] **Step 10: Create src/renderer/index.html**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    />
    <title>Work Time Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: Create src/renderer/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 12: Create src/renderer/src/test-setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 13: Create src/renderer/src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 14: Create src/renderer/src/main.tsx** (placeholder)

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div className="p-4 text-lg">Work Time Tracker — Loading…</div>
  </React.StrictMode>
)
```

- [ ] **Step 15: Create src/main/index.ts** (minimal placeholder)

```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 16: Create src/preload/index.ts** (placeholder)

```typescript
import { contextBridge } from 'electron'
contextBridge.exposeInMainWorld('api', {})
```

- [ ] **Step 17: Create .gitignore**

```
node_modules/
out/
dist/
.DS_Store
*.db
```

- [ ] **Step 18: Create directory structure**

```bash
mkdir -p src/main/timer src/main/history src/main/db src/main/tray \
         src/renderer/src/timer src/renderer/src/history \
         src/renderer/src/components/ui \
         src/shared/utils
```

- [ ] **Step 19: Verify dev server starts**

Run: `npm run dev`
Expected: Electron window opens showing "Work Time Tracker — Loading…". No TypeScript errors in console.

Stop the dev server (Ctrl+C).

- [ ] **Step 20: Commit**

```bash
git add package.json electron.vite.config.ts tsconfig.json tsconfig.node.json tsconfig.web.json \
        tailwind.config.js postcss.config.js vitest.workspace.ts src/ .gitignore
git commit -m "chore: scaffold electron-vite project with React, TypeScript, Tailwind"
```

---

## Task 2: Shared Types and Utilities

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/utils/time.ts`
- Create: `src/shared/utils/time.test.ts`

- [ ] **Step 1: Create src/shared/types.ts**

```typescript
export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerState {
  status: TimerStatus
  startedAt: number | null        // Unix ms
  elapsedActive: number           // ms of active (non-paused) time
  elapsedPaused: number           // ms of paused time
  pausedAt: number | null         // Unix ms of last pause start
}

export interface Session {
  id: number
  started_at: number
  stopped_at: number | null
  summary: string | null
}

export interface SessionEvent {
  id: number
  session_id: number
  type: 'pause' | 'resume'
  occurred_at: number
}

export interface SessionDetail extends Session {
  events: SessionEvent[]
}
```

- [ ] **Step 2: Write failing tests for time utilities**

Create `src/shared/utils/time.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { formatDuration, calculateActiveMs, dateRangeDefaults } from './time'
import type { SessionEvent } from '../types'

describe('formatDuration', () => {
  it('formats zero as 00:00:00', () => {
    expect(formatDuration(0)).toBe('00:00:00')
  })

  it('formats seconds only', () => {
    expect(formatDuration(45_000)).toBe('00:00:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90_000)).toBe('00:01:30')
  })

  it('formats hours', () => {
    expect(formatDuration(3_661_000)).toBe('01:01:01')
  })

  it('formats multi-hour durations', () => {
    expect(formatDuration(7_200_000)).toBe('02:00:00')
  })
})

describe('calculateActiveMs', () => {
  it('returns full duration when no events', () => {
    expect(calculateActiveMs(1000, 6000, [])).toBe(5000)
  })

  it('subtracts a single pause interval', () => {
    const events: SessionEvent[] = [
      { id: 1, session_id: 1, type: 'pause', occurred_at: 2000 },
      { id: 2, session_id: 1, type: 'resume', occurred_at: 4000 }
    ]
    // total=5000, paused=2000 → active=3000
    expect(calculateActiveMs(1000, 6000, events)).toBe(3000)
  })

  it('handles multiple pause/resume cycles', () => {
    const events: SessionEvent[] = [
      { id: 1, session_id: 1, type: 'pause', occurred_at: 2000 },
      { id: 2, session_id: 1, type: 'resume', occurred_at: 3000 },
      { id: 3, session_id: 1, type: 'pause', occurred_at: 5000 },
      { id: 4, session_id: 1, type: 'resume', occurred_at: 6000 }
    ]
    // total=7000, paused=1000+1000=2000 → active=5000
    expect(calculateActiveMs(1000, 8000, events)).toBe(5000)
  })
})

describe('dateRangeDefaults', () => {
  it('returns a range of approximately 30 days ending now', () => {
    const { from, to } = dateRangeDefaults()
    const diff = to - from
    expect(diff).toBeGreaterThanOrEqual(29 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000)
    expect(to).toBeGreaterThan(from)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run --project main src/shared/utils/time.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement src/shared/utils/time.ts**

```typescript
import type { SessionEvent } from '../types'

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function calculateActiveMs(
  startedAt: number,
  stoppedAt: number,
  events: SessionEvent[]
): number {
  let pausedMs = 0
  let pauseStart: number | null = null

  for (const event of events) {
    if (event.type === 'pause') {
      pauseStart = event.occurred_at
    } else if (event.type === 'resume' && pauseStart !== null) {
      pausedMs += event.occurred_at - pauseStart
      pauseStart = null
    }
  }

  return stoppedAt - startedAt - pausedMs
}

export function dateRangeDefaults(): { from: number; to: number } {
  const to = Date.now()
  const fromDate = new Date(to)
  fromDate.setDate(fromDate.getDate() - 30)
  fromDate.setHours(0, 0, 0, 0)
  return { from: fromDate.getTime(), to }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run --project main src/shared/utils/time.test.ts`
Expected: PASS — 7/7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts src/shared/utils/time.ts src/shared/utils/time.test.ts
git commit -m "feat: add shared types and time utility functions"
```

---

## Task 3: Database Setup

**Files:**
- Create: `src/main/db/database.ts`
- Create: `src/main/db/database.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/main/db/database.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { openDatabase, runMigrations } from './database'

describe('database', () => {
  let db: Database.Database

  beforeEach(() => {
    db = openDatabase(':memory:')
    runMigrations(db)
  })

  afterEach(() => db.close())

  it('creates the sessions table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
      .get()
    expect(row).toBeTruthy()
  })

  it('creates the events table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
      .get()
    expect(row).toBeTruthy()
  })

  it('sessions table has required columns', () => {
    const cols = (db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[]).map(
      (c) => c.name
    )
    expect(cols).toEqual(expect.arrayContaining(['id', 'started_at', 'stopped_at', 'summary']))
  })

  it('events table has required columns', () => {
    const cols = (db.prepare('PRAGMA table_info(events)').all() as { name: string }[]).map(
      (c) => c.name
    )
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'session_id', 'type', 'occurred_at'])
    )
  })

  it('runMigrations is idempotent', () => {
    expect(() => runMigrations(db)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project main src/main/db/database.test.ts`
Expected: FAIL — `openDatabase` and `runMigrations` not found.

- [ ] **Step 3: Implement src/main/db/database.ts**

```typescript
import Database from 'better-sqlite3'

export function openDatabase(path: string): Database.Database {
  return new Database(path)
}

export function openUserDatabase(): Database.Database {
  const { app } = require('electron')
  const { join } = require('path')
  return new Database(join(app.getPath('userData'), 'sessions.db'))
}

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      stopped_at INTEGER,
      summary    TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES sessions(id),
      type        TEXT NOT NULL,
      occurred_at INTEGER NOT NULL
    );
  `)
}
```

Note: `openUserDatabase` uses `require('electron')` (lazy) so tests can call `openDatabase(':memory:')` directly without importing Electron.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project main src/main/db/database.test.ts`
Expected: PASS — 5/5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/main/db/database.ts src/main/db/database.test.ts
git commit -m "feat: add SQLite database setup with migrations"
```

---

## Task 4: SessionRepository

**Files:**
- Create: `src/main/db/SessionRepository.ts`
- Create: `src/main/db/SessionRepository.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/main/db/SessionRepository.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { openDatabase, runMigrations } from './database'
import { SessionRepository } from './SessionRepository'

describe('SessionRepository', () => {
  let db: Database.Database
  let repo: SessionRepository

  beforeEach(() => {
    db = openDatabase(':memory:')
    runMigrations(db)
    repo = new SessionRepository(db)
  })

  afterEach(() => db.close())

  it('insert returns a positive integer id', () => {
    const id = repo.insert(1000)
    expect(id).toBeGreaterThan(0)
  })

  it('getById returns the session', () => {
    const id = repo.insert(1000)
    const session = repo.getById(id)
    expect(session).toBeTruthy()
    expect(session!.started_at).toBe(1000)
    expect(session!.stopped_at).toBeNull()
    expect(session!.summary).toBeNull()
  })

  it('getById returns null for unknown id', () => {
    expect(repo.getById(999)).toBeNull()
  })

  it('updateStopped sets stopped_at and summary', () => {
    const id = repo.insert(1000)
    repo.updateStopped(id, 2000, 'great session')
    const session = repo.getById(id)!
    expect(session.stopped_at).toBe(2000)
    expect(session.summary).toBe('great session')
  })

  it('queryByDateRange returns sessions with started_at in [from, to]', () => {
    const a = repo.insert(1000)
    const b = repo.insert(5000)
    const c = repo.insert(9000)
    repo.updateStopped(a, 2000, 'a')
    repo.updateStopped(b, 6000, 'b')
    repo.updateStopped(c, 10000, 'c')

    const results = repo.queryByDateRange(500, 5500)
    expect(results).toHaveLength(2)
    const startedAts = results.map((r) => r.started_at)
    expect(startedAts).toContain(1000)
    expect(startedAts).toContain(5000)
  })

  it('queryByDateRange returns sessions ordered by started_at DESC', () => {
    const a = repo.insert(3000)
    const b = repo.insert(1000)
    const c = repo.insert(2000)
    repo.updateStopped(a, 4000, 'a')
    repo.updateStopped(b, 5000, 'b')
    repo.updateStopped(c, 6000, 'c')
    const results = repo.queryByDateRange(0, 9999)
    expect(results[0].started_at).toBe(3000)
    expect(results[1].started_at).toBe(2000)
    expect(results[2].started_at).toBe(1000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project main src/main/db/SessionRepository.test.ts`
Expected: FAIL — `SessionRepository` not found.

- [ ] **Step 3: Implement src/main/db/SessionRepository.ts**

```typescript
import Database from 'better-sqlite3'
import type { Session } from '@shared/types'

export class SessionRepository {
  constructor(private db: Database.Database) {}

  insert(startedAt: number): number {
    const result = this.db
      .prepare('INSERT INTO sessions (started_at) VALUES (?)')
      .run(startedAt)
    return result.lastInsertRowid as number
  }

  updateStopped(id: number, stoppedAt: number, summary: string): void {
    this.db
      .prepare('UPDATE sessions SET stopped_at = ?, summary = ? WHERE id = ?')
      .run(stoppedAt, summary, id)
  }

  queryByDateRange(from: number, to: number): Session[] {
    return this.db
      .prepare(
        'SELECT * FROM sessions WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC'
      )
      .all(from, to) as Session[]
  }

  getById(id: number): Session | null {
    return (
      (this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined) ??
      null
    )
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project main src/main/db/SessionRepository.test.ts`
Expected: PASS — 6/6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/main/db/SessionRepository.ts src/main/db/SessionRepository.test.ts
git commit -m "feat: add SessionRepository"
```

---

## Task 5: EventRepository

**Files:**
- Create: `src/main/db/EventRepository.ts`
- Create: `src/main/db/EventRepository.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/main/db/EventRepository.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { openDatabase, runMigrations } from './database'
import { SessionRepository } from './SessionRepository'
import { EventRepository } from './EventRepository'

describe('EventRepository', () => {
  let db: Database.Database
  let sessionRepo: SessionRepository
  let eventRepo: EventRepository
  let sessionId: number

  beforeEach(() => {
    db = openDatabase(':memory:')
    runMigrations(db)
    sessionRepo = new SessionRepository(db)
    eventRepo = new EventRepository(db)
    sessionId = sessionRepo.insert(1000)
  })

  afterEach(() => db.close())

  it('inserts a pause event', () => {
    eventRepo.insert(sessionId, 'pause', 2000)
    const events = eventRepo.getBySessionId(sessionId)
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('pause')
    expect(events[0].occurred_at).toBe(2000)
    expect(events[0].session_id).toBe(sessionId)
  })

  it('inserts a resume event', () => {
    eventRepo.insert(sessionId, 'resume', 3000)
    const events = eventRepo.getBySessionId(sessionId)
    expect(events[0].type).toBe('resume')
  })

  it('returns events ordered by occurred_at ASC', () => {
    eventRepo.insert(sessionId, 'resume', 3000)
    eventRepo.insert(sessionId, 'pause', 2000)
    const events = eventRepo.getBySessionId(sessionId)
    expect(events[0].occurred_at).toBe(2000)
    expect(events[1].occurred_at).toBe(3000)
  })

  it('returns only events for the given session', () => {
    const other = sessionRepo.insert(5000)
    eventRepo.insert(sessionId, 'pause', 2000)
    eventRepo.insert(other, 'pause', 6000)
    const events = eventRepo.getBySessionId(sessionId)
    expect(events).toHaveLength(1)
    expect(events[0].session_id).toBe(sessionId)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project main src/main/db/EventRepository.test.ts`
Expected: FAIL — `EventRepository` not found.

- [ ] **Step 3: Implement src/main/db/EventRepository.ts**

```typescript
import Database from 'better-sqlite3'
import type { SessionEvent } from '@shared/types'

export class EventRepository {
  constructor(private db: Database.Database) {}

  insert(sessionId: number, type: 'pause' | 'resume', occurredAt: number): void {
    this.db
      .prepare('INSERT INTO events (session_id, type, occurred_at) VALUES (?, ?, ?)')
      .run(sessionId, type, occurredAt)
  }

  getBySessionId(sessionId: number): SessionEvent[] {
    return this.db
      .prepare('SELECT * FROM events WHERE session_id = ? ORDER BY occurred_at ASC')
      .all(sessionId) as SessionEvent[]
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project main src/main/db/EventRepository.test.ts`
Expected: PASS — 4/4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/main/db/EventRepository.ts src/main/db/EventRepository.test.ts
git commit -m "feat: add EventRepository"
```

---

## Task 6: TimerService

**Files:**
- Create: `src/main/timer/TimerService.ts`
- Create: `src/main/timer/TimerService.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/main/timer/TimerService.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { openDatabase, runMigrations } from '../db/database'
import { SessionRepository } from '../db/SessionRepository'
import { EventRepository } from '../db/EventRepository'
import { TimerService } from './TimerService'

describe('TimerService', () => {
  let db: Database.Database
  let sessionRepo: SessionRepository
  let eventRepo: EventRepository
  let timer: TimerService

  beforeEach(() => {
    db = openDatabase(':memory:')
    runMigrations(db)
    sessionRepo = new SessionRepository(db)
    eventRepo = new EventRepository(db)
    timer = new TimerService(sessionRepo, eventRepo)
    vi.useFakeTimers()
  })

  afterEach(() => {
    db.close()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('is idle with zero elapsed times', () => {
      const state = timer.getState()
      expect(state.status).toBe('idle')
      expect(state.elapsedActive).toBe(0)
      expect(state.elapsedPaused).toBe(0)
      expect(state.startedAt).toBeNull()
    })
  })

  describe('start()', () => {
    it('transitions to running', () => {
      timer.start()
      expect(timer.getState().status).toBe('running')
    })

    it('records startedAt', () => {
      vi.setSystemTime(1000)
      timer.start()
      expect(timer.getState().startedAt).toBe(1000)
    })

    it('persists session to DB', () => {
      vi.setSystemTime(1000)
      timer.start()
      const sessions = sessionRepo.queryByDateRange(0, 9999)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].started_at).toBe(1000)
    })

    it('is a no-op if already running', () => {
      timer.start()
      timer.start()
      expect(sessionRepo.queryByDateRange(0, 9999)).toHaveLength(1)
    })
  })

  describe('elapsed time while running', () => {
    it('calculates elapsedActive from start to now', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(5000)
      const state = timer.getState()
      expect(state.elapsedActive).toBe(5000)
      expect(state.elapsedPaused).toBe(0)
    })
  })

  describe('pause()', () => {
    it('transitions to paused', () => {
      timer.start()
      timer.pause()
      expect(timer.getState().status).toBe('paused')
    })

    it('freezes elapsedActive at pause time', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(3000)
      timer.pause()
      vi.setSystemTime(6000)
      expect(timer.getState().elapsedActive).toBe(3000)
    })

    it('accumulates elapsedPaused while paused', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(3000)
      timer.pause()
      vi.setSystemTime(5000)
      expect(timer.getState().elapsedPaused).toBe(2000)
    })

    it('records pause event in DB', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(3000)
      timer.pause()
      const session = sessionRepo.queryByDateRange(0, 9999)[0]
      const events = eventRepo.getBySessionId(session.id)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('pause')
      expect(events[0].occurred_at).toBe(3000)
    })
  })

  describe('resume()', () => {
    it('transitions back to running', () => {
      timer.start()
      timer.pause()
      timer.resume()
      expect(timer.getState().status).toBe('running')
    })

    it('continues accumulating active time after resume', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(3000)
      timer.pause()
      vi.setSystemTime(5000)
      timer.resume()
      vi.setSystemTime(8000)
      const state = timer.getState()
      expect(state.elapsedActive).toBe(6000) // 3s before pause + 3s after resume
      expect(state.elapsedPaused).toBe(2000)
    })

    it('records resume event in DB', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(3000)
      timer.pause()
      vi.setSystemTime(5000)
      timer.resume()
      const session = sessionRepo.queryByDateRange(0, 9999)[0]
      const events = eventRepo.getBySessionId(session.id)
      expect(events).toHaveLength(2)
      expect(events[1].type).toBe('resume')
      expect(events[1].occurred_at).toBe(5000)
    })
  })

  describe('stop()', () => {
    it('transitions to idle', () => {
      timer.start()
      timer.stop('done')
      expect(timer.getState().status).toBe('idle')
    })

    it('resets all state', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(5000)
      timer.stop('done')
      const state = timer.getState()
      expect(state.elapsedActive).toBe(0)
      expect(state.elapsedPaused).toBe(0)
      expect(state.startedAt).toBeNull()
    })

    it('persists stopped_at and summary to DB', () => {
      vi.setSystemTime(0)
      timer.start()
      vi.setSystemTime(5000)
      timer.stop('great session')
      const session = sessionRepo.queryByDateRange(0, 9999)[0]
      expect(session.stopped_at).toBe(5000)
      expect(session.summary).toBe('great session')
    })

    it('can stop from paused state', () => {
      timer.start()
      timer.pause()
      expect(() => timer.stop('done while paused')).not.toThrow()
      expect(timer.getState().status).toBe('idle')
    })
  })

  describe('listeners', () => {
    it('notifies listeners on state change', () => {
      const listener = vi.fn()
      timer.addListener(listener)
      timer.start()
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 'running' }))
    })

    it('does not notify after removeListener', () => {
      const listener = vi.fn()
      timer.addListener(listener)
      timer.removeListener(listener)
      timer.start()
      expect(listener).not.toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project main src/main/timer/TimerService.test.ts`
Expected: FAIL — `TimerService` not found.

- [ ] **Step 3: Implement src/main/timer/TimerService.ts**

```typescript
import type { TimerState, TimerStatus } from '@shared/types'
import type { SessionRepository } from '../db/SessionRepository'
import type { EventRepository } from '../db/EventRepository'

export class TimerService {
  private status: TimerStatus = 'idle'
  private startedAt: number | null = null
  private pausedAt: number | null = null
  private totalPausedMs = 0
  private activeSessionId: number | null = null
  private listeners = new Set<(state: TimerState) => void>()

  constructor(
    private sessionRepo: SessionRepository,
    private eventRepo: EventRepository
  ) {}

  getState(): TimerState {
    const now = Date.now()
    if (this.status === 'idle') {
      return { status: 'idle', startedAt: null, elapsedActive: 0, elapsedPaused: 0, pausedAt: null }
    }
    if (this.status === 'running') {
      return {
        status: 'running',
        startedAt: this.startedAt,
        elapsedActive: now - this.startedAt! - this.totalPausedMs,
        elapsedPaused: this.totalPausedMs,
        pausedAt: null
      }
    }
    // paused: active time is frozen; paused time keeps accumulating
    return {
      status: 'paused',
      startedAt: this.startedAt,
      elapsedActive: this.pausedAt! - this.startedAt! - this.totalPausedMs,
      elapsedPaused: this.totalPausedMs + (now - this.pausedAt!),
      pausedAt: this.pausedAt
    }
  }

  start(): void {
    if (this.status !== 'idle') return
    const now = Date.now()
    this.startedAt = now
    this.totalPausedMs = 0
    this.pausedAt = null
    this.status = 'running'
    this.activeSessionId = this.sessionRepo.insert(now)
    this.notify()
  }

  pause(): void {
    if (this.status !== 'running') return
    const now = Date.now()
    this.pausedAt = now
    this.status = 'paused'
    this.eventRepo.insert(this.activeSessionId!, 'pause', now)
    this.notify()
  }

  resume(): void {
    if (this.status !== 'paused') return
    const now = Date.now()
    this.totalPausedMs += now - this.pausedAt!
    this.pausedAt = null
    this.status = 'running'
    this.eventRepo.insert(this.activeSessionId!, 'resume', now)
    this.notify()
  }

  stop(summary: string): void {
    if (this.status === 'idle') return
    const now = Date.now()
    this.sessionRepo.updateStopped(this.activeSessionId!, now, summary)
    this.status = 'idle'
    this.startedAt = null
    this.pausedAt = null
    this.totalPausedMs = 0
    this.activeSessionId = null
    this.notify()
  }

  addListener(listener: (state: TimerState) => void): void {
    this.listeners.add(listener)
  }

  removeListener(listener: (state: TimerState) => void): void {
    this.listeners.delete(listener)
  }

  private notify(): void {
    const state = this.getState()
    for (const listener of this.listeners) listener(state)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project main src/main/timer/TimerService.test.ts`
Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/main/timer/TimerService.ts src/main/timer/TimerService.test.ts
git commit -m "feat: add TimerService state machine with DB persistence"
```

---

## Task 7: IPC Layer and Preload

**Files:**
- Create: `src/main/timer/timer.ipc.ts`
- Create: `src/main/history/history.ipc.ts`
- Modify: `src/preload/index.ts`
- Create: `src/renderer/src/env.d.ts`

No unit tests for IPC handlers — they are thin glue between Electron IPC and the service/repo layer, and mocking `ipcMain` provides no meaningful coverage.

- [ ] **Step 1: Create src/main/timer/timer.ipc.ts**

```typescript
import { ipcMain, BrowserWindow } from 'electron'
import type { TimerService } from './TimerService'

export function registerTimerIpc(timer: TimerService, win: BrowserWindow): void {
  ipcMain.handle('timer:start', () => timer.start())
  ipcMain.handle('timer:pause', () => timer.pause())
  ipcMain.handle('timer:resume', () => timer.resume())
  ipcMain.handle('timer:stop', (_e, summary: string) => timer.stop(summary))
  ipcMain.handle('timer:getState', () => timer.getState())

  timer.addListener((state) => {
    if (!win.isDestroyed()) {
      win.webContents.send('timer:stateChanged', state)
    }
  })
}
```

- [ ] **Step 2: Create src/main/history/history.ipc.ts**

```typescript
import { ipcMain } from 'electron'
import type { SessionRepository } from '../db/SessionRepository'
import type { EventRepository } from '../db/EventRepository'
import type { SessionDetail } from '@shared/types'

export function registerHistoryIpc(
  sessionRepo: SessionRepository,
  eventRepo: EventRepository
): void {
  ipcMain.handle('history:query', (_e, from: number, to: number) =>
    sessionRepo.queryByDateRange(from, to)
  )

  ipcMain.handle('history:getDetail', (_e, sessionId: number): SessionDetail | null => {
    const session = sessionRepo.getById(sessionId)
    if (!session) return null
    return { ...session, events: eventRepo.getBySessionId(sessionId) }
  })
}
```

- [ ] **Step 3: Update src/preload/index.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import type { TimerState, Session, SessionDetail } from '@shared/types'

contextBridge.exposeInMainWorld('api', {
  timer: {
    start: (): Promise<void> => ipcRenderer.invoke('timer:start'),
    pause: (): Promise<void> => ipcRenderer.invoke('timer:pause'),
    resume: (): Promise<void> => ipcRenderer.invoke('timer:resume'),
    stop: (summary: string): Promise<void> => ipcRenderer.invoke('timer:stop', summary),
    getState: (): Promise<TimerState> => ipcRenderer.invoke('timer:getState'),
    onStateChange: (cb: (state: TimerState) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, state: TimerState): void => cb(state)
      ipcRenderer.on('timer:stateChanged', handler)
      return () => ipcRenderer.off('timer:stateChanged', handler)
    }
  },
  history: {
    query: (from: number, to: number): Promise<Session[]> =>
      ipcRenderer.invoke('history:query', from, to),
    getDetail: (sessionId: number): Promise<SessionDetail | null> =>
      ipcRenderer.invoke('history:getDetail', sessionId)
  }
})
```

- [ ] **Step 4: Create src/renderer/src/env.d.ts**

```typescript
import type { TimerState, Session, SessionDetail } from '@shared/types'

declare global {
  interface Window {
    api: {
      timer: {
        start: () => Promise<void>
        pause: () => Promise<void>
        resume: () => Promise<void>
        stop: (summary: string) => Promise<void>
        getState: () => Promise<TimerState>
        onStateChange: (cb: (state: TimerState) => void) => () => void
      }
      history: {
        query: (from: number, to: number) => Promise<Session[]>
        getDetail: (sessionId: number) => Promise<SessionDetail | null>
      }
    }
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/main/timer/timer.ipc.ts src/main/history/history.ipc.ts \
        src/preload/index.ts src/renderer/src/env.d.ts
git commit -m "feat: add IPC handlers and preload contextBridge API"
```

---

## Task 8: Main Entry Point and TrayManager

**Files:**
- Create: `src/main/tray/TrayManager.ts`
- Modify: `src/main/index.ts`

No unit tests — `Tray` and `BrowserWindow` require a running Electron environment.

- [ ] **Step 1: Create src/main/tray/TrayManager.ts**

Tray icons are generated at runtime as 16×16 solid-color PNGs using only Node.js built-ins (`zlib`).

```typescript
import { Tray, Menu, nativeImage, app } from 'electron'
import { deflateSync } from 'zlib'
import type { TimerState } from '@shared/types'
import type { TimerService } from '../timer/TimerService'
import { formatDuration } from '../../shared/utils/time'

// CRC32 table used for PNG chunk checksums
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data: Buffer): number {
  let c = 0xffffffff
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeColorIcon(r: number, g: number, b: number, size = 16): Electron.NativeImage {
  // Build raw PNG scanlines: filter_byte(0) + r + g + b per pixel, per row
  const rowLen = 1 + size * 3
  const raw = Buffer.alloc(size * rowLen)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0
    for (let x = 0; x < size; x++) {
      raw[y * rowLen + 1 + x * 3] = r
      raw[y * rowLen + 1 + x * 3 + 1] = g
      raw[y * rowLen + 1 + x * 3 + 2] = b
    }
  }
  const compressed = deflateSync(raw)

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8; ihdrData[9] = 2 // 8-bit RGB
  const ihdrType = Buffer.from('IHDR')
  const ihdrChunk = Buffer.alloc(25)
  ihdrChunk.writeUInt32BE(13, 0)
  ihdrType.copy(ihdrChunk, 4)
  ihdrData.copy(ihdrChunk, 8)
  ihdrChunk.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])), 21)

  // IDAT
  const idatType = Buffer.from('IDAT')
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4)
  idatChunk.writeUInt32BE(compressed.length, 0)
  idatType.copy(idatChunk, 4)
  compressed.copy(idatChunk, 8)
  idatChunk.writeUInt32BE(crc32(Buffer.concat([idatType, compressed])), 8 + compressed.length)

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    ihdrChunk,
    idatChunk,
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]) // IEND
  ])

  return nativeImage.createFromBuffer(png)
}

const ICONS = {
  idle: makeColorIcon(150, 150, 150),    // gray
  running: makeColorIcon(34, 197, 94),   // green
  paused: makeColorIcon(249, 115, 22)    // orange
}

export class TrayManager {
  private tray: Tray
  private tickInterval: NodeJS.Timeout | null = null
  private lastState: TimerState | null = null

  constructor(private timer: TimerService, private openWindow: () => void) {
    this.tray = new Tray(ICONS.idle)
    this.tray.setToolTip('Work Time Tracker')
    this.timer.addListener((state) => this.onStateChange(state))
    this.rebuild(this.timer.getState())
  }

  private onStateChange(state: TimerState): void {
    this.lastState = state
    this.rebuild(state)

    if (state.status === 'running') {
      if (!this.tickInterval) {
        this.tickInterval = setInterval(() => {
          const current = this.timer.getState()
          this.tray.setToolTip(`Running — ${formatDuration(current.elapsedActive)}`)
        }, 1000)
      }
    } else {
      if (this.tickInterval) {
        clearInterval(this.tickInterval)
        this.tickInterval = null
      }
    }
  }

  private rebuild(state: TimerState): void {
    this.tray.setImage(ICONS[state.status])

    const tooltip =
      state.status === 'idle'
        ? 'Work Time Tracker'
        : state.status === 'running'
        ? `Running — ${formatDuration(state.elapsedActive)}`
        : `Paused — ${formatDuration(state.elapsedActive)}`
    this.tray.setToolTip(tooltip)

    const menu = Menu.buildFromTemplate([
      {
        label: 'Start',
        enabled: state.status === 'idle',
        click: () => this.timer.start()
      },
      {
        label: 'Pause',
        enabled: state.status === 'running',
        click: () => this.timer.pause()
      },
      {
        label: 'Resume',
        enabled: state.status === 'paused',
        click: () => this.timer.resume()
      },
      {
        label: 'Stop…',
        enabled: state.status !== 'idle',
        click: () => {
          this.openWindow()
          // User must complete the stop dialog in the renderer
        }
      },
      { type: 'separator' },
      { label: 'Open Window', click: () => this.openWindow() },
      { label: 'Quit', click: () => app.quit() }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval)
    this.tray.destroy()
  }
}
```

- [ ] **Step 2: Update src/main/index.ts to wire everything together**

```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { openUserDatabase, runMigrations } from './db/database'
import { SessionRepository } from './db/SessionRepository'
import { EventRepository } from './db/EventRepository'
import { TimerService } from './timer/TimerService'
import { registerTimerIpc } from './timer/timer.ipc'
import { registerHistoryIpc } from './history/history.ipc'
import { TrayManager } from './tray/TrayManager'

let win: BrowserWindow | null = null
let tray: TrayManager | null = null

function openWindow(): void {
  if (win && !win.isDestroyed()) {
    win.show()
    win.focus()
    return
  }
  createWindow()
}

function createWindow(): void {
  const db = openUserDatabase()
  runMigrations(db)

  const sessionRepo = new SessionRepository(db)
  const eventRepo = new EventRepository(db)
  const timer = new TimerService(sessionRepo, eventRepo)

  win = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  registerTimerIpc(timer, win)
  registerHistoryIpc(sessionRepo, eventRepo)

  if (!tray) {
    tray = new TrayManager(timer, openWindow)
  }

  win.on('closed', () => { win = null })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // Keep running in tray on all platforms
})

app.on('activate', () => {
  openWindow()
})

app.on('before-quit', () => {
  tray?.destroy()
})
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Start the app and verify tray icon appears**

Run: `npm run dev`
Expected: Electron window opens. System tray shows a gray circle icon. Right-clicking the tray shows "Start / Pause (disabled) / Resume (disabled) / Stop… (disabled) / Open Window / Quit".

Stop the dev server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add src/main/tray/TrayManager.ts src/main/index.ts \
        src/main/timer/timer.ipc.ts src/main/history/history.ipc.ts
git commit -m "feat: wire main process — BrowserWindow, IPC, TrayManager"
```

---

## Task 9: shadcn/ui Component Setup

**Files:**
- Create: `src/renderer/src/components/ui/button.tsx`
- Create: `src/renderer/src/components/ui/dialog.tsx`
- Create: `src/renderer/src/components/ui/tabs.tsx`
- Create: `src/renderer/src/components/ui/input.tsx`
- Create: `src/renderer/src/components/ui/label.tsx`
- Create: `src/renderer/src/components/ui/textarea.tsx`
- Create: `src/renderer/src/components/ui/badge.tsx`
- Create: `src/renderer/src/components/ui/scroll-area.tsx`

These are standard shadcn/ui components. Copy them from the shadcn/ui registry using the CLI.

- [ ] **Step 1: Initialize shadcn/ui**

From the project root, run:
```bash
npx shadcn-ui@latest init
```

When prompted:
- TypeScript: yes
- Style: Default
- Base color: Slate
- CSS variables: yes
- Tailwind config: `tailwind.config.js`
- Components alias: `@renderer/components`
- Utils alias: `@renderer/lib/utils`
- React Server Components: no

If the CLI creates a `components.json`, keep it. If the CSS variables differ from those in `index.css`, merge them (prefer values already in `index.css`).

- [ ] **Step 2: Add required components**

```bash
npx shadcn-ui@latest add button dialog tabs input label textarea badge scroll-area
```

Expected: Files created in `src/renderer/src/components/ui/`.

- [ ] **Step 3: Verify components compile**

Run: `npx tsc --noEmit`
Expected: No errors. If the CLI wrote imports using `@/components/ui` or `@/lib/utils`, search-replace them to use `@renderer/components/ui` and `@renderer/lib/utils` respectively.

Fix any path aliases that don't match project conventions:
```bash
# Check for @/ imports and replace
grep -r '"@/' src/renderer/src/components/ui/ --include='*.tsx' -l
# For each file found, replace '@/' with '@renderer/'
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/ components.json
git commit -m "chore: add shadcn/ui components (button, dialog, tabs, input, label, textarea, badge, scroll-area)"
```

---

## Task 10: Timer Zustand Store

**Files:**
- Create: `src/renderer/src/timer/timerStore.ts`
- Create: `src/renderer/src/timer/timerStore.test.ts`

The store syncs with the main process via `window.api.timer`. Tests mock `window.api`.

- [ ] **Step 1: Write failing tests**

Create `src/renderer/src/timer/timerStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useTimerStore } from './timerStore'
import type { TimerState } from '@shared/types'

const makeState = (overrides: Partial<TimerState> = {}): TimerState => ({
  status: 'idle',
  startedAt: null,
  elapsedActive: 0,
  elapsedPaused: 0,
  pausedAt: null,
  ...overrides
})

const mockApi = {
  timer: {
    getState: vi.fn().mockResolvedValue(makeState()),
    onStateChange: vi.fn().mockReturnValue(vi.fn()),
    start: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined)
  },
  history: {
    query: vi.fn().mockResolvedValue([]),
    getDetail: vi.fn().mockResolvedValue(null)
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { api: mockApi })
  useTimerStore.setState(makeState())
  vi.clearAllMocks()
  mockApi.timer.getState.mockResolvedValue(makeState())
  mockApi.timer.onStateChange.mockReturnValue(vi.fn())
})

describe('useTimerStore', () => {
  it('starts with idle state', () => {
    const state = useTimerStore.getState()
    expect(state.status).toBe('idle')
    expect(state.elapsedActive).toBe(0)
  })

  it('syncFromMain fetches state and subscribes to changes', async () => {
    const runningState = makeState({ status: 'running', elapsedActive: 5000 })
    mockApi.timer.getState.mockResolvedValue(runningState)

    await act(async () => {
      await useTimerStore.getState().syncFromMain()
    })

    expect(useTimerStore.getState().status).toBe('running')
    expect(useTimerStore.getState().elapsedActive).toBe(5000)
    expect(mockApi.timer.onStateChange).toHaveBeenCalled()
  })

  it('applyState merges incoming state', () => {
    act(() => {
      useTimerStore.getState().applyState(makeState({ status: 'running', elapsedActive: 3000 }))
    })
    expect(useTimerStore.getState().status).toBe('running')
    expect(useTimerStore.getState().elapsedActive).toBe(3000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project renderer src/renderer/src/timer/timerStore.test.ts`
Expected: FAIL — `timerStore` module not found.

- [ ] **Step 3: Implement src/renderer/src/timer/timerStore.ts**

```typescript
import { create } from 'zustand'
import type { TimerState } from '@shared/types'

interface TimerStore extends TimerState {
  applyState: (state: TimerState) => void
  syncFromMain: () => Promise<() => void>
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
  }
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project renderer src/renderer/src/timer/timerStore.test.ts`
Expected: PASS — 3/3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/timer/timerStore.ts src/renderer/src/timer/timerStore.test.ts
git commit -m "feat: add timer Zustand store with IPC sync"
```

---

## Task 11: Timer UI Components

**Files:**
- Create: `src/renderer/src/timer/useTimer.ts`
- Create: `src/renderer/src/timer/TimerDisplay.tsx`
- Create: `src/renderer/src/timer/TimerDisplay.test.tsx`
- Create: `src/renderer/src/timer/TimerControls.tsx`
- Create: `src/renderer/src/timer/TimerControls.test.tsx`
- Create: `src/renderer/src/timer/StopDialog.tsx`
- Create: `src/renderer/src/timer/StopDialog.test.tsx`
- Create: `src/renderer/src/timer/TimerPage.tsx`

- [ ] **Step 1: Create src/renderer/src/timer/useTimer.ts**

```typescript
import { useEffect, useRef } from 'react'
import { useTimerStore } from './timerStore'

export function useTimer() {
  const unsubRef = useRef<(() => void) | null>(null)
  const syncFromMain = useTimerStore((s) => s.syncFromMain)

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

  return {
    start: () => window.api.timer.start(),
    pause: () => window.api.timer.pause(),
    resume: () => window.api.timer.resume(),
    stop: (summary: string) => window.api.timer.stop(summary)
  }
}
```

- [ ] **Step 2: Write failing test for TimerDisplay**

Create `src/renderer/src/timer/TimerDisplay.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { TimerDisplay } from './TimerDisplay'
import { useTimerStore } from './timerStore'

beforeEach(() => {
  useTimerStore.setState({
    status: 'idle',
    startedAt: null,
    elapsedActive: 0,
    elapsedPaused: 0,
    pausedAt: null
  })
})

describe('TimerDisplay', () => {
  it('shows 00:00:00 when idle', () => {
    render(<TimerDisplay />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('displays formatted active elapsed time', () => {
    act(() => {
      useTimerStore.setState({ status: 'running', elapsedActive: 90_000, elapsedPaused: 0 })
    })
    render(<TimerDisplay />)
    expect(screen.getByText('00:01:30')).toBeInTheDocument()
  })

  it('shows paused label and paused time when paused', () => {
    act(() => {
      useTimerStore.setState({
        status: 'paused',
        elapsedActive: 60_000,
        elapsedPaused: 30_000
      })
    })
    render(<TimerDisplay />)
    expect(screen.getByText('00:01:00')).toBeInTheDocument()
    expect(screen.getByText(/paused/i)).toBeInTheDocument()
    expect(screen.getByText('00:00:30')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run --project renderer src/renderer/src/timer/TimerDisplay.test.tsx`
Expected: FAIL — `TimerDisplay` not found.

- [ ] **Step 4: Create src/renderer/src/timer/TimerDisplay.tsx**

```tsx
import { useTimerStore } from './timerStore'
import { formatDuration } from '@shared/utils/time'

export function TimerDisplay() {
  const status = useTimerStore((s) => s.status)
  const elapsedActive = useTimerStore((s) => s.elapsedActive)
  const elapsedPaused = useTimerStore((s) => s.elapsedPaused)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-mono text-7xl font-bold tabular-nums tracking-tight">
        {formatDuration(elapsedActive)}
      </div>
      {status === 'paused' && (
        <p className="text-sm text-muted-foreground">
          Paused — {formatDuration(elapsedPaused)}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run TimerDisplay tests to verify they pass**

Run: `npx vitest run --project renderer src/renderer/src/timer/TimerDisplay.test.tsx`
Expected: PASS — 3/3 tests pass.

- [ ] **Step 6: Write failing test for TimerControls**

Create `src/renderer/src/timer/TimerControls.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { TimerControls } from './TimerControls'
import { useTimerStore } from './timerStore'

const mockActions = {
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onStop: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  useTimerStore.setState({
    status: 'idle',
    startedAt: null,
    elapsedActive: 0,
    elapsedPaused: 0,
    pausedAt: null
  })
})

describe('TimerControls', () => {
  it('shows Start button when idle', () => {
    render(<TimerControls {...mockActions} />)
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
  })

  it('calls onStart when Start is clicked', async () => {
    render(<TimerControls {...mockActions} />)
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(mockActions.onStart).toHaveBeenCalledOnce()
  })

  it('shows Pause and Stop buttons when running', async () => {
    act(() => useTimerStore.setState({ status: 'running', elapsedActive: 5000, elapsedPaused: 0 }))
    render(<TimerControls {...mockActions} />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
  })

  it('calls onPause when Pause is clicked', async () => {
    act(() => useTimerStore.setState({ status: 'running', elapsedActive: 5000, elapsedPaused: 0 }))
    render(<TimerControls {...mockActions} />)
    await userEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(mockActions.onPause).toHaveBeenCalledOnce()
  })

  it('shows Resume and Stop buttons when paused', () => {
    act(() =>
      useTimerStore.setState({ status: 'paused', elapsedActive: 5000, elapsedPaused: 2000 })
    )
    render(<TimerControls {...mockActions} />)
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
  })

  it('calls onStop when Stop is clicked', async () => {
    act(() => useTimerStore.setState({ status: 'running', elapsedActive: 5000, elapsedPaused: 0 }))
    render(<TimerControls {...mockActions} />)
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    expect(mockActions.onStop).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run --project renderer src/renderer/src/timer/TimerControls.test.tsx`
Expected: FAIL — `TimerControls` not found.

- [ ] **Step 8: Create src/renderer/src/timer/TimerControls.tsx**

```tsx
import { useTimerStore } from './timerStore'
import { Button } from '@renderer/components/ui/button'

interface TimerControlsProps {
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function TimerControls({ onStart, onPause, onResume, onStop }: TimerControlsProps) {
  const status = useTimerStore((s) => s.status)

  if (status === 'idle') {
    return (
      <Button size="lg" onClick={onStart} className="w-32">
        Start
      </Button>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onPause} className="w-32">
          Pause
        </Button>
        <Button variant="destructive" size="lg" onClick={onStop} className="w-32">
          Stop
        </Button>
      </div>
    )
  }

  // paused
  return (
    <div className="flex gap-3">
      <Button size="lg" onClick={onResume} className="w-32">
        Resume
      </Button>
      <Button variant="destructive" size="lg" onClick={onStop} className="w-32">
        Stop
      </Button>
    </div>
  )
}
```

- [ ] **Step 9: Run TimerControls tests to verify they pass**

Run: `npx vitest run --project renderer src/renderer/src/timer/TimerControls.test.tsx`
Expected: PASS — 5/5 tests pass.

- [ ] **Step 10: Write failing test for StopDialog**

Create `src/renderer/src/timer/StopDialog.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StopDialog } from './StopDialog'

describe('StopDialog', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders the dialog with a summary textarea', () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('Confirm button is disabled when summary is empty', () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
  })

  it('Confirm button is enabled when summary has text', async () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.type(screen.getByRole('textbox'), 'Finished feature X')
    expect(screen.getByRole('button', { name: /confirm/i })).toBeEnabled()
  })

  it('calls onConfirm with the summary text', async () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.type(screen.getByRole('textbox'), 'Done for today')
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledWith('Done for today')
  })

  it('calls onCancel when Cancel is clicked', async () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does not render when open is false', () => {
    render(<StopDialog open={false} onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npx vitest run --project renderer src/renderer/src/timer/StopDialog.test.tsx`
Expected: FAIL — `StopDialog` not found.

- [ ] **Step 12: Create src/renderer/src/timer/StopDialog.tsx**

```tsx
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'

interface StopDialogProps {
  open: boolean
  onConfirm: (summary: string) => void
  onCancel: () => void
}

export function StopDialog({ open, onConfirm, onCancel }: StopDialogProps) {
  const [summary, setSummary] = useState('')

  const handleConfirm = () => {
    if (!summary.trim()) return
    onConfirm(summary.trim())
    setSummary('')
  }

  const handleCancel = () => {
    setSummary('')
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stop Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="summary">What did you work on?</Label>
          <Textarea
            id="summary"
            placeholder="Describe what you accomplished…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!summary.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 13: Run StopDialog tests to verify they pass**

Run: `npx vitest run --project renderer src/renderer/src/timer/StopDialog.test.tsx`
Expected: PASS — 6/6 tests pass.

- [ ] **Step 14: Create src/renderer/src/timer/TimerPage.tsx**

```tsx
import { useState } from 'react'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { StopDialog } from './StopDialog'
import { useTimer } from './useTimer'

export function TimerPage() {
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const { start, pause, resume, stop } = useTimer()

  const handleStop = () => setStopDialogOpen(true)

  const handleConfirmStop = async (summary: string) => {
    setStopDialogOpen(false)
    await stop(summary)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <TimerDisplay />
      <TimerControls
        onStart={start}
        onPause={pause}
        onResume={resume}
        onStop={handleStop}
      />
      <StopDialog
        open={stopDialogOpen}
        onConfirm={handleConfirmStop}
        onCancel={() => setStopDialogOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 15: Run all timer tests**

Run: `npx vitest run --project renderer src/renderer/src/timer/`
Expected: PASS — all tests pass.

- [ ] **Step 16: Commit**

```bash
git add src/renderer/src/timer/
git commit -m "feat: add timer UI components (TimerDisplay, TimerControls, StopDialog, TimerPage)"
```

---

## Task 12: History Store

**Files:**
- Create: `src/renderer/src/history/historyStore.ts`
- Create: `src/renderer/src/history/historyStore.test.ts`
- Create: `src/renderer/src/history/useHistory.ts`

- [ ] **Step 1: Write failing tests**

Create `src/renderer/src/history/historyStore.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useHistoryStore } from './historyStore'
import type { Session } from '@shared/types'

const mockSessions: Session[] = [
  { id: 1, started_at: 1000, stopped_at: 5000, summary: 'First session' },
  { id: 2, started_at: 6000, stopped_at: 9000, summary: 'Second session' }
]

const mockApi = {
  history: {
    query: vi.fn().mockResolvedValue(mockSessions),
    getDetail: vi.fn().mockResolvedValue(null)
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { api: mockApi })
  useHistoryStore.setState({ sessions: [], selectedId: null, from: 0, to: 99999 })
  vi.clearAllMocks()
  mockApi.history.query.mockResolvedValue(mockSessions)
})

describe('useHistoryStore', () => {
  it('starts with empty sessions', () => {
    expect(useHistoryStore.getState().sessions).toHaveLength(0)
  })

  it('load fetches sessions for the date range', async () => {
    await act(async () => {
      await useHistoryStore.getState().load(0, 99999)
    })
    expect(mockApi.history.query).toHaveBeenCalledWith(0, 99999)
    expect(useHistoryStore.getState().sessions).toHaveLength(2)
  })

  it('setRange updates from/to and re-fetches', async () => {
    await act(async () => {
      await useHistoryStore.getState().setRange(1000, 5000)
    })
    expect(useHistoryStore.getState().from).toBe(1000)
    expect(useHistoryStore.getState().to).toBe(5000)
    expect(mockApi.history.query).toHaveBeenCalledWith(1000, 5000)
  })

  it('selectSession sets selectedId', () => {
    act(() => useHistoryStore.getState().selectSession(2))
    expect(useHistoryStore.getState().selectedId).toBe(2)
  })

  it('selectSession with same id deselects (toggle)', () => {
    act(() => useHistoryStore.getState().selectSession(2))
    act(() => useHistoryStore.getState().selectSession(2))
    expect(useHistoryStore.getState().selectedId).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project renderer src/renderer/src/history/historyStore.test.ts`
Expected: FAIL — `historyStore` not found.

- [ ] **Step 3: Implement src/renderer/src/history/historyStore.ts**

```typescript
import { create } from 'zustand'
import type { Session } from '@shared/types'
import { dateRangeDefaults } from '@shared/utils/time'

interface HistoryStore {
  sessions: Session[]
  selectedId: number | null
  from: number
  to: number
  load: (from: number, to: number) => Promise<void>
  setRange: (from: number, to: number) => Promise<void>
  selectSession: (id: number) => void
}

const defaults = dateRangeDefaults()

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  sessions: [],
  selectedId: null,
  from: defaults.from,
  to: defaults.to,

  load: async (from, to) => {
    const sessions = await window.api.history.query(from, to)
    set({ sessions })
  },

  setRange: async (from, to) => {
    set({ from, to })
    await get().load(from, to)
  },

  selectSession: (id) => {
    set((s) => ({ selectedId: s.selectedId === id ? null : id }))
  }
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project renderer src/renderer/src/history/historyStore.test.ts`
Expected: PASS — 5/5 tests pass.

- [ ] **Step 5: Create src/renderer/src/history/useHistory.ts**

```typescript
import { useEffect } from 'react'
import { useHistoryStore } from './historyStore'

export function useHistory() {
  const { load, from, to } = useHistoryStore()

  useEffect(() => {
    load(from, to)
  }, [load, from, to])

  return useHistoryStore()
}
```

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/history/historyStore.ts src/renderer/src/history/historyStore.test.ts \
        src/renderer/src/history/useHistory.ts
git commit -m "feat: add history Zustand store with date range query"
```

---

## Task 13: History UI Components

**Files:**
- Create: `src/renderer/src/history/SessionRow.tsx`
- Create: `src/renderer/src/history/SessionRow.test.tsx`
- Create: `src/renderer/src/history/SessionDetail.tsx`
- Create: `src/renderer/src/history/SessionList.tsx`
- Create: `src/renderer/src/history/HistoryPage.tsx`

- [ ] **Step 1: Write failing test for SessionRow**

Create `src/renderer/src/history/SessionRow.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SessionRow } from './SessionRow'
import type { Session } from '@shared/types'

const session: Session = {
  id: 1,
  started_at: new Date('2026-05-01T09:00:00').getTime(),
  stopped_at: new Date('2026-05-01T11:30:00').getTime(),
  summary: 'Worked on the feature that does the thing and was very important for the release'
}

describe('SessionRow', () => {
  it('renders the session date', () => {
    render(<SessionRow session={session} selected={false} onClick={vi.fn()} />)
    expect(screen.getByText(/2026-05-01/)).toBeInTheDocument()
  })

  it('renders formatted active duration', () => {
    render(<SessionRow session={session} selected={false} onClick={vi.fn()} />)
    // 2.5 hours = 02:30:00
    expect(screen.getByText('02:30:00')).toBeInTheDocument()
  })

  it('truncates summary to ~60 characters', () => {
    render(<SessionRow session={session} selected={false} onClick={vi.fn()} />)
    const text = screen.getByTestId('summary').textContent ?? ''
    expect(text.length).toBeLessThanOrEqual(63) // 60 + '...'
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<SessionRow session={session} selected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('row'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies selected styling when selected', () => {
    render(<SessionRow session={session} selected onClick={vi.fn()} />)
    expect(screen.getByRole('row')).toHaveClass('bg-muted')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --project renderer src/renderer/src/history/SessionRow.test.tsx`
Expected: FAIL — `SessionRow` not found.

- [ ] **Step 3: Create src/renderer/src/history/SessionRow.tsx**

```tsx
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
```

- [ ] **Step 4: Run SessionRow tests to verify they pass**

Run: `npx vitest run --project renderer src/renderer/src/history/SessionRow.test.tsx`
Expected: PASS — 5/5 tests pass.

- [ ] **Step 5: Create src/renderer/src/history/SessionDetail.tsx**

No dedicated unit test — it's a pure display component; covered by HistoryPage integration.

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
      <div className="flex gap-4">
        <div>
          <span className="font-medium">Start:</span> {fmt(detail.started_at)}
        </div>
        <div>
          <span className="font-medium">Stop:</span>{' '}
          {detail.stopped_at ? fmt(detail.stopped_at) : '—'}
        </div>
      </div>

      <div className="flex gap-4">
        <Badge variant="secondary">Active: {formatDuration(activeMs)}</Badge>
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

- [ ] **Step 6: Create src/renderer/src/history/SessionList.tsx**

```tsx
import type { Session } from '@shared/types'
import { SessionRow } from './SessionRow'
import { calculateActiveMs } from '@shared/utils/time'
import { formatDuration } from '@shared/utils/time'

interface SessionListProps {
  sessions: Session[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function SessionList({ sessions, selectedId, onSelect }: SessionListProps) {
  const totalActiveMs = sessions.reduce(
    (sum, s) => sum + calculateActiveMs(s.started_at, s.stopped_at ?? Date.now(), []),
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
```

- [ ] **Step 7: Create src/renderer/src/history/HistoryPage.tsx**

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
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={toDateValue(from)}
            onChange={(e) => setRange(fromMs(e.target.value), to)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={toDateValue(to)}
            onChange={(e) => setRange(from, fromMs(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-auto rounded border">
          <SessionList
            sessions={sessions}
            selectedId={selectedId}
            onSelect={selectSession}
          />
        </div>
        {selectedId !== null && (
          <div className="w-80 overflow-auto rounded border">
            <SessionDetail sessionId={selectedId} />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run all history tests**

Run: `npx vitest run --project renderer src/renderer/src/history/`
Expected: PASS — all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/history/
git commit -m "feat: add history UI (SessionRow, SessionList, SessionDetail, HistoryPage)"
```

---

## Task 14: App Layout and Renderer Entry

**Files:**
- Create: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/main.tsx`

- [ ] **Step 1: Create src/renderer/src/App.tsx**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { TimerPage } from '@renderer/timer/TimerPage'
import { HistoryPage } from '@renderer/history/HistoryPage'

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <Tabs defaultValue="timer" className="flex flex-1 flex-col">
        <TabsList className="shrink-0 rounded-none border-b px-4">
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

- [ ] **Step 2: Update src/renderer/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Start the app and verify the full UI works**

Run: `npm run dev`

Test the following:
1. Timer tab shows "00:00:00" with a Start button
2. Clicking Start changes display to show running time and Pause/Stop buttons
3. Clicking Pause shows Resume/Stop buttons and a "Paused — …" label
4. Clicking Stop opens the stop dialog; Confirm button is disabled with empty textarea
5. Typing a summary enables Confirm; clicking Confirm resets timer to idle
6. Switching to History tab shows date pickers and "No sessions found" initially — then shows session(s) after stopping one
7. Clicking a session row shows the detail panel on the right
8. System tray icon turns green when running, orange when paused, gray when idle
9. Tray context menu items reflect current state

Stop the dev server (Ctrl+C).

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: All tests across both `main` and `renderer` projects pass.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/main.tsx
git commit -m "feat: wire App.tsx with Timer and History tabs"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task Covering It |
|---|---|
| idle → running → paused state machine | Task 6: TimerService |
| Elapsed active time excludes pause | Task 6: TimerService, Task 10: timerStore |
| Stop flow: non-empty summary required | Task 11: StopDialog |
| Session + events persisted to SQLite | Tasks 3-6 |
| History: date range picker | Task 13: HistoryPage |
| History: session list with truncated summary | Task 13: SessionRow |
| History: total hours for period | Task 13: SessionList |
| History: detail panel (events, active/paused breakdown) | Task 13: SessionDetail |
| System tray: colored icon per state | Task 8: TrayManager |
| System tray: tooltip with elapsed time | Task 8: TrayManager |
| System tray: context menu Start/Pause/Resume/Stop | Task 8: TrayManager |
| IPC: contextBridge, no nodeIntegration | Tasks 7-8 |
| TimerService tests | Task 6 |
| SessionRepository tests | Task 4 |
| EventRepository tests | Task 5 |
| time.ts utils tests | Task 2 |
| timerStore tests | Task 10 |
| StopDialog: cannot confirm empty | Task 11 |
| SessionRow: truncated summary, duration | Task 13 |

All spec requirements are covered. ✓

### Placeholder Scan

No TBD, TODO, or "implement later" phrases present. All code blocks contain full implementations. ✓

### Type Consistency Check

| Symbol | Defined in | Used consistently in |
|---|---|---|
| `TimerStatus` | `src/shared/types.ts` | TimerService, timerStore, TimerControls |
| `TimerState` | `src/shared/types.ts` | TimerService, timer.ipc.ts, preload, timerStore |
| `Session` | `src/shared/types.ts` | SessionRepository, historyStore, SessionRow |
| `SessionEvent` | `src/shared/types.ts` | EventRepository, SessionDetail, time.ts |
| `SessionDetail` | `src/shared/types.ts` | history.ipc.ts, SessionDetail.tsx |
| `formatDuration` | `src/shared/utils/time.ts` | TimerDisplay, SessionRow, TrayManager, SessionList |
| `calculateActiveMs` | `src/shared/utils/time.ts` | SessionRow, SessionDetail, SessionList |
| `dateRangeDefaults` | `src/shared/utils/time.ts` | historyStore |

All consistent. ✓
