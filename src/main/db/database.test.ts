import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { openDatabase, runMigrations } from './database'

describe('database', () => {
  let db: Database.Database

  beforeEach(() => {
    db = openDatabase(':memory:')
    runMigrations(db)
  })

  afterEach(() => db.close())

  it('creates the sessions table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
      .get()
    expect(row).toBeTruthy()
  })

  it('creates the events table', () => {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
      .get()
    expect(row).toBeTruthy()
  })

  it('sessions table has required columns', () => {
    const cols = (db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[]).map(
      (c) => c.name
    )
    expect(cols).toEqual(expect.arrayContaining(['id', 'started_at', 'stopped_at', 'summary']))
  })

  it('events table has required columns', () => {
    const cols = (db.prepare('PRAGMA table_info(events)').all() as { name: string }[]).map(
      (c) => c.name
    )
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'session_id', 'type', 'occurred_at'])
    )
  })

  it('runMigrations is idempotent', () => {
    expect(() => runMigrations(db)).not.toThrow()
  })
})
