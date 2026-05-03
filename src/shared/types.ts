export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerState {
  status: TimerStatus
  startedAt: number | null        // Unix ms
  elapsedActive: number           // ms of active (non-paused) time
  elapsedPaused: number           // ms of paused time
  pausedAt: number | null         // Unix ms of last pause start
}

export interface Session {
  id: number
  started_at: number
  stopped_at: number | null
  summary: string | null
}

export interface SessionEvent {
  id: number
  session_id: number
  type: 'pause' | 'resume'
  occurred_at: number
}

export interface SessionDetail extends Session {
  events: SessionEvent[]
}
