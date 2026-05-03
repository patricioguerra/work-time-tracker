import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useHistoryStore } from './historyStore'
import type { Session } from '@shared/types'

const mockSessions: Session[] = [
  { id: 1, started_at: 1000, stopped_at: 5000, summary: 'First session' },
  { id: 2, started_at: 6000, stopped_at: 9000, summary: 'Second session' }
]

const mockApi = {
  history: {
    query: vi.fn().mockResolvedValue(mockSessions),
    getDetail: vi.fn().mockResolvedValue(null)
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { api: mockApi })
  useHistoryStore.setState({ sessions: [], selectedId: null, from: 0, to: 99999 })
  vi.clearAllMocks()
  mockApi.history.query.mockResolvedValue(mockSessions)
})

describe('useHistoryStore', () => {
  it('starts with empty sessions', () => {
    expect(useHistoryStore.getState().sessions).toHaveLength(0)
  })

  it('load fetches sessions for the date range', async () => {
    await act(async () => {
      await useHistoryStore.getState().load(0, 99999)
    })
    expect(mockApi.history.query).toHaveBeenCalledWith(0, 99999)
    expect(useHistoryStore.getState().sessions).toHaveLength(2)
  })

  it('setRange updates from/to and re-fetches', async () => {
    await act(async () => {
      await useHistoryStore.getState().setRange(1000, 5000)
    })
    expect(useHistoryStore.getState().from).toBe(1000)
    expect(useHistoryStore.getState().to).toBe(5000)
    expect(mockApi.history.query).toHaveBeenCalledWith(1000, 5000)
  })

  it('selectSession sets selectedId', () => {
    act(() => useHistoryStore.getState().selectSession(2))
    expect(useHistoryStore.getState().selectedId).toBe(2)
  })

  it('selectSession with same id deselects (toggle)', () => {
    act(() => useHistoryStore.getState().selectSession(2))
    act(() => useHistoryStore.getState().selectSession(2))
    expect(useHistoryStore.getState().selectedId).toBeNull()
  })
})
