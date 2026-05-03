import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { runMigrations } from './database'

describe('database', () => {
  let db: SqlJsDatabase
  let SQL: any

  beforeEach(async () => {
    SQL = await initSqlJs()
    db = new SQL.Database()
    runMigrations(db as any)
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  it('creates the sessions table', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
    stmt.bind()
    const hasRow = stmt.step()
    stmt.free()
    expect(hasRow).toBeTruthy()
  })

  it('creates the events table', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    stmt.bind()
    const hasRow = stmt.step()
    stmt.free()
    expect(hasRow).toBeTruthy()
  })

  it('sessions table has required columns', () => {
    const stmt = db.prepare('PRAGMA table_info(sessions)')
    const cols: string[] = []
    stmt.bind()
    while (stmt.step()) {
      const row = stmt.getAsObject()
      cols.push(row.name as string)
    }
    stmt.free()
    expect(cols).toEqual(expect.arrayContaining(['id', 'started_at', 'stopped_at', 'summary']))
  })

  it('events table has required columns', () => {
    const stmt = db.prepare('PRAGMA table_info(events)')
    const cols: string[] = []
    stmt.bind()
    while (stmt.step()) {
      const row = stmt.getAsObject()
      cols.push(row.name as string)
    }
    stmt.free()
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'session_id', 'type', 'occurred_at'])
    )
  })

  it('runMigrations is idempotent', () => {
    expect(() => runMigrations(db as any)).not.toThrow()
  })
})
