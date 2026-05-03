import { ipcMain } from 'electron'
import type { TimerService } from './TimerService'

export function registerTimerIpcHandlers(timer: TimerService): void {
  ipcMain.handle('timer:start', () => timer.start())
  ipcMain.handle('timer:pause', () => timer.pause())
  ipcMain.handle('timer:resume', () => timer.resume())
  ipcMain.handle('timer:stop', (_e, summary: string) => timer.stop(summary))
  ipcMain.handle('timer:getState', () => timer.getState())
}

export function bridgeTimerStateToWindow(
  timer: TimerService,
  getWin: () => Electron.BrowserWindow | null
): void {
  timer.addListener((state) => {
    const win = getWin()
    if (win && !win.isDestroyed()) {
      win.webContents.send('timer:stateChanged', state)
    }
  })
}
