import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { TimerControls } from './TimerControls'
import { useTimerStore } from './timerStore'

const mockActions = {
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onStop: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  useTimerStore.setState({
    status: 'idle',
    startedAt: null,
    elapsedActive: 0,
    elapsedPaused: 0,
    pausedAt: null
  })
})

describe('TimerControls', () => {
  it('shows Start button when idle', () => {
    render(<TimerControls {...mockActions} />)
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
  })

  it('calls onStart when Start is clicked', async () => {
    render(<TimerControls {...mockActions} />)
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(mockActions.onStart).toHaveBeenCalledOnce()
  })

  it('shows Pause and Stop buttons when running', async () => {
    act(() => useTimerStore.setState({ status: 'running', elapsedActive: 5000, elapsedPaused: 0 }))
    render(<TimerControls {...mockActions} />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
  })

  it('calls onPause when Pause is clicked', async () => {
    act(() => useTimerStore.setState({ status: 'running', elapsedActive: 5000, elapsedPaused: 0 }))
    render(<TimerControls {...mockActions} />)
    await userEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(mockActions.onPause).toHaveBeenCalledOnce()
  })

  it('shows Resume and Stop buttons when paused', () => {
    act(() =>
      useTimerStore.setState({ status: 'paused', elapsedActive: 5000, elapsedPaused: 2000 })
    )
    render(<TimerControls {...mockActions} />)
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
  })

  it('calls onStop when Stop is clicked', async () => {
    act(() => useTimerStore.setState({ status: 'running', elapsedActive: 5000, elapsedPaused: 0 }))
    render(<TimerControls {...mockActions} />)
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    expect(mockActions.onStop).toHaveBeenCalledOnce()
  })
})
