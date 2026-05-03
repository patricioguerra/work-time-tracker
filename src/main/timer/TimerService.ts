import type { TimerState, TimerStatus } from '@shared/types'
import type { SessionRepository } from '../db/SessionRepository'
import type { EventRepository } from '../db/EventRepository'

export class TimerService {
  private status: TimerStatus = 'idle'
  private startedAt: number | null = null
  private pausedAt: number | null = null
  private totalPausedMs = 0
  private activeSessionId: number | null = null
  private listeners = new Set<(state: TimerState) => void>()

  constructor(
    private sessionRepo: SessionRepository,
    private eventRepo: EventRepository
  ) {}

  getState(): TimerState {
    const now = Date.now()
    if (this.status === 'idle') {
      return { status: 'idle', startedAt: null, elapsedActive: 0, elapsedPaused: 0, pausedAt: null }
    }
    if (this.status === 'running') {
      return {
        status: 'running',
        startedAt: this.startedAt,
        elapsedActive: now - this.startedAt! - this.totalPausedMs,
        elapsedPaused: this.totalPausedMs,
        pausedAt: null
      }
    }
    // paused: active time is frozen; paused time keeps accumulating
    return {
      status: 'paused',
      startedAt: this.startedAt,
      elapsedActive: this.pausedAt! - this.startedAt! - this.totalPausedMs,
      elapsedPaused: this.totalPausedMs + (now - this.pausedAt!),
      pausedAt: this.pausedAt
    }
  }

  start(): void {
    if (this.status !== 'idle') return
    const now = Date.now()
    this.startedAt = now
    this.totalPausedMs = 0
    this.pausedAt = null
    this.status = 'running'
    this.activeSessionId = this.sessionRepo.insert(now)
    this.notify()
  }

  pause(): void {
    if (this.status !== 'running') return
    const now = Date.now()
    this.pausedAt = now
    this.status = 'paused'
    this.eventRepo.insert(this.activeSessionId!, 'pause', now)
    this.notify()
  }

  resume(): void {
    if (this.status !== 'paused') return
    const now = Date.now()
    this.totalPausedMs += now - this.pausedAt!
    this.pausedAt = null
    this.status = 'running'
    this.eventRepo.insert(this.activeSessionId!, 'resume', now)
    this.notify()
  }

  stop(summary: string): void {
    if (this.status === 'idle') return
    const now = Date.now()
    this.sessionRepo.updateStopped(this.activeSessionId!, now, summary)
    this.status = 'idle'
    this.startedAt = null
    this.pausedAt = null
    this.totalPausedMs = 0
    this.activeSessionId = null
    this.notify()
  }

  addListener(listener: (state: TimerState) => void): void {
    this.listeners.add(listener)
  }

  removeListener(listener: (state: TimerState) => void): void {
    this.listeners.delete(listener)
  }

  private notify(): void {
    const state = this.getState()
    for (const listener of this.listeners) listener(state)
  }
}
