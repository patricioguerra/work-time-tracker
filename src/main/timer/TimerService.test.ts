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
