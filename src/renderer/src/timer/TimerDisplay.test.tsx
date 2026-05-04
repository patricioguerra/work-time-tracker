import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { TimerDisplay } from './TimerDisplay'
import { useTimerStore } from './timerStore'

beforeEach(() => {
  useTimerStore.setState({
    status: 'idle',
    startedAt: null,
    elapsedActive: 0,
    elapsedPaused: 0,
    pausedAt: null
  })
})

describe('TimerDisplay', () => {
  it('shows 00:00:00 when idle', () => {
    render(<TimerDisplay />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('displays formatted active elapsed time', () => {
    act(() => {
      useTimerStore.setState({ status: 'running', elapsedActive: 90_000, elapsedPaused: 0 })
    })
    render(<TimerDisplay />)
    expect(screen.getByText('00:01:30')).toBeInTheDocument()
  })

  it('shows paused label and paused time when paused', () => {
    act(() => {
      useTimerStore.setState({
        status: 'paused',
        elapsedActive: 60_000,
        elapsedPaused: 30_000
      })
    })
    render(<TimerDisplay />)
    expect(screen.getByText('00:01:00')).toBeInTheDocument()
    expect(screen.getAllByText(/paused/i).length).toBeGreaterThan(0)
    expect(screen.getByText('00:00:30')).toBeInTheDocument()
  })
})
