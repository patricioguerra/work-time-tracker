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
