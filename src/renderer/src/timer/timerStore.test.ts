import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useTimerStore } from './timerStore'
import type { TimerState } from '@shared/types'

const makeState = (overrides: Partial<TimerState> = {}): TimerState => ({
  status: 'idle',
  startedAt: null,
  elapsedActive: 0,
  elapsedPaused: 0,
  pausedAt: null,
  ...overrides
})

const mockApi = {
  timer: {
    getState: vi.fn().mockResolvedValue(makeState()),
    onStateChange: vi.fn().mockReturnValue(vi.fn()),
    start: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined)
  },
  history: {
    query: vi.fn().mockResolvedValue([]),
    getDetail: vi.fn().mockResolvedValue(null)
  }
}

beforeEach(() => {
  vi.stubGlobal('window', { api: mockApi })
  useTimerStore.setState(makeState())
  vi.clearAllMocks()
  mockApi.timer.getState.mockResolvedValue(makeState())
  mockApi.timer.onStateChange.mockReturnValue(vi.fn())
})

describe('useTimerStore', () => {
  it('starts with idle state', () => {
    const state = useTimerStore.getState()
    expect(state.status).toBe('idle')
    expect(state.elapsedActive).toBe(0)
  })

  it('syncFromMain fetches state and subscribes to changes', async () => {
    const runningState = makeState({ status: 'running', elapsedActive: 5000 })
    mockApi.timer.getState.mockResolvedValue(runningState)

    await act(async () => {
      await useTimerStore.getState().syncFromMain()
    })

    expect(useTimerStore.getState().status).toBe('running')
    expect(useTimerStore.getState().elapsedActive).toBe(5000)
    expect(mockApi.timer.onStateChange).toHaveBeenCalled()
  })

  it('applyState merges incoming state', () => {
    act(() => {
      useTimerStore.getState().applyState(makeState({ status: 'running', elapsedActive: 3000 }))
    })
    expect(useTimerStore.getState().status).toBe('running')
    expect(useTimerStore.getState().elapsedActive).toBe(3000)
  })
})

describe('tick', () => {
  it('updates elapsedActive when running', () => {
    const startedAt = Date.now() - 5000
    useTimerStore.setState({
      status: 'running',
      startedAt,
      elapsedActive: 0,
      elapsedPaused: 1000,
      pausedAt: null
    })

    act(() => {
      useTimerStore.getState().tick()
    })

    const { elapsedActive } = useTimerStore.getState()
    // 5000ms elapsed, 1000ms was paused → ~4000ms active
    expect(elapsedActive).toBeGreaterThanOrEqual(3800)
    expect(elapsedActive).toBeLessThanOrEqual(4200)
  })

  it('does not update elapsedActive when paused', () => {
    useTimerStore.setState({
      status: 'paused',
      startedAt: Date.now() - 5000,
      elapsedActive: 3000,
      elapsedPaused: 2000,
      pausedAt: Date.now()
    })

    act(() => {
      useTimerStore.getState().tick()
    })

    expect(useTimerStore.getState().elapsedActive).toBe(3000)
  })

  it('does not update elapsedActive when idle', () => {
    act(() => {
      useTimerStore.getState().tick()
    })
    expect(useTimerStore.getState().elapsedActive).toBe(0)
  })
})
