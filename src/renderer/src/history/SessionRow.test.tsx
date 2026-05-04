import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SessionRow } from './SessionRow'
import type { SessionDetail } from '@shared/types'

const session: SessionDetail = {
  id: 1,
  started_at: new Date('2026-05-01T09:00:00').getTime(),
  stopped_at: new Date('2026-05-01T11:30:00').getTime(),
  summary: 'Worked on the feature that does the thing and was very important for the release',
  events: []
}

describe('SessionRow', () => {
  it('renders the session date', () => {
    render(<SessionRow session={session} selected={false} onClick={vi.fn()} />)
    expect(screen.getByText(/2026-05-01/)).toBeInTheDocument()
  })

  it('renders formatted active duration', () => {
    render(<SessionRow session={session} selected={false} onClick={vi.fn()} />)
    // 2.5 hours = 02:30:00
    expect(screen.getByText('02:30:00')).toBeInTheDocument()
  })

  it('truncates summary to ~60 characters', () => {
    render(<SessionRow session={session} selected={false} onClick={vi.fn()} />)
    const text = screen.getByTestId('summary').textContent ?? ''
    expect(text.length).toBeLessThanOrEqual(63) // 60 + '...'
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<SessionRow session={session} selected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('row'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies selected styling when selected', () => {
    render(<SessionRow session={session} selected onClick={vi.fn()} />)
    expect(screen.getByRole('row')).toHaveClass('bg-green-900/20')
  })
})
