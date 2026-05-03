import { create } from 'zustand'
import type { Session } from '@shared/types'
import { dateRangeDefaults } from '@shared/utils/time'

export interface HistoryStore {
  sessions: Session[]
  selectedId: number | null
  from: number
  to: number
  load: (from: number, to: number) => Promise<void>
  setRange: (from: number, to: number) => Promise<void>
  selectSession: (id: number) => void
}

const defaults = dateRangeDefaults()

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  sessions: [],
  selectedId: null,
  from: defaults.from,
  to: defaults.to,

  load: async (from, to) => {
    const sessions = await window.api.history.query(from, to)
    set({ sessions })
  },

  setRange: async (from, to) => {
    set({ from, to })
    await get().load(from, to)
  },

  selectSession: (id) => {
    set((s) => ({ selectedId: s.selectedId === id ? null : id }))
  }
}))
