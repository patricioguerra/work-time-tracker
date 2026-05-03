import type { TimerState, Session, SessionDetail } from '@shared/types'

declare global {
  interface Window {
    api: {
      timer: {
        start: () => Promise<void>
        pause: () => Promise<void>
        resume: () => Promise<void>
        stop: (summary: string) => Promise<void>
        getState: () => Promise<TimerState>
        onStateChange: (cb: (state: TimerState) => void) => () => void
      }
      history: {
        query: (from: number, to: number) => Promise<Session[]>
        getDetail: (sessionId: number) => Promise<SessionDetail | null>
      }
    }
  }
}
