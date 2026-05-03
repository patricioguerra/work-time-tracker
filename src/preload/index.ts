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
