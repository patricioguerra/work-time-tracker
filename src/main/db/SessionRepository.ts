import Database from 'better-sqlite3'
import type { Session } from '@shared/types'

export class SessionRepository {
  constructor(private db: Database.Database) {}

  insert(startedAt: number): number {
    const result = this.db
      .prepare('INSERT INTO sessions (started_at) VALUES (?)')
      .run(startedAt)
    return result.lastInsertRowid as number
  }

  updateStopped(id: number, stoppedAt: number, summary: string): void {
    this.db
      .prepare('UPDATE sessions SET stopped_at = ?, summary = ? WHERE id = ?')
      .run(stoppedAt, summary, id)
  }

  queryByDateRange(from: number, to: number): Session[] {
    return this.db
      .prepare(
        'SELECT * FROM sessions WHERE started_at >= ? AND started_at <= ? AND stopped_at IS NOT NULL ORDER BY started_at DESC'
      )
      .all(from, to) as Session[]
  }

  getById(id: number): Session | null {
    return (
      (this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined) ??
      null
    )
  }
}
