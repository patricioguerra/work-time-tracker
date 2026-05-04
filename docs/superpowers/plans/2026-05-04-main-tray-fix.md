# Main Process Tray Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix window close behavior so closing the window hides it to the system tray instead of destroying it, keeping the timer running and accessible on Fedora 44 / GNOME.

**Architecture:** Intercept the `close` event on `BrowserWindow` and call `hide()` instead of letting it close. The existing `openWindow()` function already handles re-showing a hidden window (`win.show()` / `win.focus()`). Remove the `closed` handler that was setting `win = null`. Add a startup log about the AppIndicator GNOME extension requirement.

**Tech Stack:** Electron `BrowserWindow` lifecycle events (`close` vs `closed`)

---

## File Map

| File | Change |
|---|---|
| `src/main/index.ts` | Intercept `close` event → `hide()`; remove `closed` handler; add startup log |

---

### Task 1: Fix window close → hide

**Files:**
- Modify: `src/main/index.ts`

No unit tests are possible for Electron `BrowserWindow` lifecycle events in Vitest — skip. Manual verification below.

- [ ] **Step 1: Open the file**

Read `src/main/index.ts`. The relevant section is `createWindow()`:

```ts
win.on('closed', () => { win = null })
```

- [ ] **Step 2: Replace the `closed` handler with a `close` handler**

Replace this block inside `createWindow()`:

```ts
win.on('closed', () => { win = null })
```

with:

```ts
win.on('close', (e) => {
  e.preventDefault()
  win?.hide()
})
```

`close` fires before the window is destroyed and allows `preventDefault()`. `closed` fires after destruction and does not. Removing the `win = null` assignment is intentional — the window stays in memory and `openWindow()` will reuse it.

- [ ] **Step 3: Add AppIndicator startup log**

In `app.whenReady().then(...)`, after `tray = new TrayManager(timer, openWindow)`, add:

```ts
console.log('[tray] Icon active. On GNOME/Fedora, install "AppIndicator and KStatusNotifierItem Support" extension if icon is not visible.')
```

- [ ] **Step 4: Verify the full updated `src/main/index.ts`**

The final file should look like this (complete):

```ts
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { openUserDatabase, runMigrations } from './db/database'
import { SessionRepository } from './db/SessionRepository'
import { EventRepository } from './db/EventRepository'
import { TimerService } from './timer/TimerService'
import { registerTimerIpcHandlers, bridgeTimerStateToWindow } from './timer/timer.ipc'
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
  win = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('close', (e) => {
    e.preventDefault()
    win?.hide()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  const db = openUserDatabase()
  runMigrations(db)

  const sessionRepo = new SessionRepository(db)
  const eventRepo = new EventRepository(db)
  const timer = new TimerService(sessionRepo, eventRepo)

  registerTimerIpcHandlers(timer)
  registerHistoryIpc(sessionRepo, eventRepo)

  createWindow()

  tray = new TrayManager(timer, openWindow)
  console.log('[tray] Icon active. On GNOME/Fedora, install "AppIndicator and KStatusNotifierItem Support" extension if icon is not visible.')

  bridgeTimerStateToWindow(timer, () => win)
})

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

- [ ] **Step 5: Build and manually verify**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

Then run the app:
```bash
./release/linux-unpacked/work-time-tracker
```

Verify:
1. App starts, tray icon appears (gray square)
2. Click Start — icon turns green
3. Close the window with the X button → window disappears but app keeps running (tray stays)
4. Click tray icon → context menu appears
5. Click "Open Window" → window reappears with timer still counting
6. Quit from tray → app exits

- [ ] **Step 6: Commit**

```bash
git add src/main/index.ts
git commit -m "fix: hide window to tray on close instead of destroying it"
```
