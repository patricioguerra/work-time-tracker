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
