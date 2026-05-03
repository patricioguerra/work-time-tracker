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
