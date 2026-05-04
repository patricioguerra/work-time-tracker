import { create } from 'zustand'
import type { TimerState } from '@shared/types'

interface TimerStore extends TimerState {
  applyState: (state: TimerState) => void
  syncFromMain: () => Promise<() => void>
  tick: () => void
}

export const useTimerStore = create<TimerStore>((set) => ({
  status: 'idle',
  startedAt: null,
  elapsedActive: 0,
  elapsedPaused: 0,
  pausedAt: null,

  applyState: (state: TimerState) => set(state),

  syncFromMain: async () => {
    const initial = await window.api.timer.getState()
    set(initial)
    const unsub = window.api.timer.onStateChange((state) => set(state))
    return unsub
  },

  tick: () =>
    set((s) => {
      if (s.status !== 'running' || s.startedAt === null) return {}
      return { elapsedActive: Date.now() - s.startedAt - s.elapsedPaused }
    })
}))
