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
