import { describe, it, expect } from 'vitest'
import { formatDuration, calculateActiveMs, dateRangeDefaults } from './time'
import type { SessionEvent } from '../types'

describe('formatDuration', () => {
  it('formats zero as 00:00:00', () => {
    expect(formatDuration(0)).toBe('00:00:00')
  })

  it('formats seconds only', () => {
    expect(formatDuration(45_000)).toBe('00:00:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90_000)).toBe('00:01:30')
  })

  it('formats hours', () => {
    expect(formatDuration(3_661_000)).toBe('01:01:01')
  })

  it('formats multi-hour durations', () => {
    expect(formatDuration(7_200_000)).toBe('02:00:00')
  })
})

describe('calculateActiveMs', () => {
  it('returns full duration when no events', () => {
    expect(calculateActiveMs(1000, 6000, [])).toBe(5000)
  })

  it('subtracts a single pause interval', () => {
    const events: SessionEvent[] = [
      { id: 1, session_id: 1, type: 'pause', occurred_at: 2000 },
      { id: 2, session_id: 1, type: 'resume', occurred_at: 4000 }
    ]
    // total=5000, paused=2000 → active=3000
    expect(calculateActiveMs(1000, 6000, events)).toBe(3000)
  })

  it('handles multiple pause/resume cycles', () => {
    const events: SessionEvent[] = [
      { id: 1, session_id: 1, type: 'pause', occurred_at: 2000 },
      { id: 2, session_id: 1, type: 'resume', occurred_at: 3000 },
      { id: 3, session_id: 1, type: 'pause', occurred_at: 5000 },
      { id: 4, session_id: 1, type: 'resume', occurred_at: 6000 }
    ]
    // total=7000, paused=1000+1000=2000 → active=5000
    expect(calculateActiveMs(1000, 8000, events)).toBe(5000)
  })
})

describe('dateRangeDefaults', () => {
  it('returns a range of approximately 30 days ending now', () => {
    const { from, to } = dateRangeDefaults()
    const diff = to - from
    expect(diff).toBeGreaterThanOrEqual(29 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000)
    expect(to).toBeGreaterThan(from)
  })
})
