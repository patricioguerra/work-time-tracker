# Work Time Tracker — Fixes & Dark Theme

**Date:** 2026-05-04

---

## Overview

Three independent fixes to the existing app:

1. Timer display not updating in real-time while running
2. Window close behavior: app should hide to tray instead of destroying the window (Fedora 44 / GNOME)
3. UI redesign: dark theme (nearly-black background, neon accents, status-driven colors)

---

## Fix 1 — Real-time Timer Tick (Renderer)

### Root cause

`TimerDisplay` reads `elapsedActive` from the Zustand store, but the store only updates when the main process fires `timer:stateChanged` (on start/pause/resume/stop). Between events, `elapsedActive` is a stale snapshot, so the display appears frozen while running. Pausing works because a state-change event fires at that exact moment.

### Fix

Add a `tick()` action to `timerStore`:

```ts
tick: () => set((s) => {
  if (s.status !== 'running' || s.startedAt === null) return {}
  return { elapsedActive: Date.now() - s.startedAt - s.elapsedPaused }
})
```

In `useTimer`, start a `setInterval(tick, 1000)` when `status === 'running'` and clear it otherwise. The interval fires locally in the renderer — no extra IPC.

### Constraints

- The tick must not run when paused (frozen display is correct then).
- The tick uses `startedAt` and `elapsedPaused` from the store, both of which are set correctly by the IPC sync on start/resume.
- Interval precision: 1 second is enough; no need for `requestAnimationFrame`.

---

## Fix 2 — Hide Window to Tray on Close (Main Process)

### Root cause

`win.on('closed', ...)` destroys the `BrowserWindow`. On GNOME (Fedora 44) the tray icon is invisible without the AppIndicator GNOME Shell extension — so users have no visible way to re-open the app after closing the window. Even if AppIndicator is installed, the current code re-creates the window from scratch on every re-open.

### Fix

Intercept the `close` event before destruction and hide the window instead:

```ts
win.on('close', (e) => {
  e.preventDefault()
  win.hide()
})
```

Update `openWindow()` to show/focus a hidden window rather than always creating one:

```ts
function openWindow(): void {
  if (win && !win.isDestroyed()) {
    win.show()
    win.focus()
    return
  }
  createWindow()
}
```

(This is already the logic, but the `closed` event currently fires and sets `win = null` before `openWindow` can reuse it. Switching to `close` + `hide` prevents that.)

Remove the `win.on('closed', () => { win = null })` handler — it's no longer needed.

### AppIndicator note

On GNOME/Fedora 44 the system tray requires the extension:
**"AppIndicator and KStatusNotifierItem Support"**
Available via GNOME Extensions or `gnome-shell-extension-appindicator` package.
The app should log a startup message: `"Tray icon active. On GNOME, install AppIndicator extension if icon is not visible."`.

---

## Fix 3 — Dark Theme + UI Redesign (Renderer)

### Design direction

Dark developer-tool aesthetic:
- Background: near-black (`#0f0f0f`)
- Surface: dark gray (`#1a1a1a`)
- Text: white / light gray
- Running state: neon green (`#22c55e` / `#4ade80`)
- Paused state: orange (`#f97316`)
- Idle state: muted gray
- Timer display: very large monospace font, centered, with a subtle text-shadow glow matching state color

### CSS variables (index.css)

Replace the default shadcn/ui light theme `@layer base :root` block with:

```css
:root {
  --background: 0 0% 6%;           /* #0f0f0f */
  --foreground: 0 0% 95%;          /* near-white */
  --card: 0 0% 10%;                /* #1a1a1a */
  --card-foreground: 0 0% 95%;
  --primary: 142 71% 45%;          /* green-500 */
  --primary-foreground: 0 0% 5%;
  --secondary: 0 0% 15%;
  --secondary-foreground: 0 0% 80%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 50%;
  --accent: 0 0% 15%;
  --accent-foreground: 0 0% 95%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 18%;
  --input: 0 0% 18%;
  --ring: 142 71% 45%;
  --radius: 0.5rem;
}
```

### TimerDisplay redesign

- Timer font: `text-8xl` (larger), keep `font-mono tabular-nums`
- Color the timer text by status: green when running, orange when paused, muted when idle
- Add `text-shadow` glow matching state color (via inline style or Tailwind `drop-shadow`)
- Status label below timer: pill badge showing "RUNNING" / "PAUSED" / "IDLE" with matching color

### TimerPage layout

- Vertically centered with more breathing room
- Add a subtle circular progress ring or just a thick colored border around the clock area (optional, skip if too complex)
- Controls below the display, same as now

### HistoryPage

- Dark card backgrounds for session rows
- Duration badge in green
- Hover highlight on rows
- Date range inputs: dark styled

### Overall

- No light mode toggle (YAGNI)
- Scrollbars: thin, dark
- Focus rings: green (`--ring`)

---

## Implementation Split (Parallel Subagents)

| Agent | Scope | Files touched |
|---|---|---|
| **A — Main** | Fix 2 (tray/hide) + startup log | `src/main/index.ts` |
| **B — Renderer** | Fix 1 (timer tick) + Fix 3 (dark theme + UI) | `src/renderer/**` |

Agents are independent: A only touches main process, B only touches renderer. No shared files. Can run in parallel git worktrees.

---

## Out of scope

- Auto-start on login
- AppIndicator auto-detection / auto-install
- Light/dark toggle
- Any feature changes beyond what's listed
