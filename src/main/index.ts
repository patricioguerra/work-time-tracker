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
