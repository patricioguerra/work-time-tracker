import Database from 'better-sqlite3'
import type { SessionEvent } from '@shared/types'

export class EventRepository {
  constructor(private db: Database.Database) {}

  insert(sessionId: number, type: 'pause' | 'resume', occurredAt: number): void {
    this.db
      .prepare('INSERT INTO events (session_id, type, occurred_at) VALUES (?, ?, ?)')
      .run(sessionId, type, occurredAt)
  }

  getBySessionId(sessionId: number): SessionEvent[] {
    return this.db
      .prepare('SELECT * FROM events WHERE session_id = ? ORDER BY occurred_at ASC')
      .all(sessionId) as SessionEvent[]
  }
}
