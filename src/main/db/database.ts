import Database from 'better-sqlite3'

export function openDatabase(path: string): Database.Database {
  return new Database(path)
}

export function openUserDatabase(): Database.Database {
  const { app } = require('electron')
  const { join } = require('path')
  return new Database(join(app.getPath('userData'), 'sessions.db'))
}

export function runMigrations(db: any): void {
  // Support both better-sqlite3 and sql.js for testing
  if (typeof db.exec === 'function') {
    // better-sqlite3 style
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at INTEGER NOT NULL,
        stopped_at INTEGER,
        summary    TEXT
      );

      CREATE TABLE IF NOT EXISTS events (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  INTEGER NOT NULL REFERENCES sessions(id),
        type        TEXT NOT NULL,
        occurred_at INTEGER NOT NULL
      );
    `)
  } else if (typeof db.run === 'function') {
    // sql.js style
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at INTEGER NOT NULL,
        stopped_at INTEGER,
        summary    TEXT
      );
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  INTEGER NOT NULL REFERENCES sessions(id),
        type        TEXT NOT NULL,
        occurred_at INTEGER NOT NULL
      );
    `)
  }
}

// Export type for use in other modules
export type { Database }
