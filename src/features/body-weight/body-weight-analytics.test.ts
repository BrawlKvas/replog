import { describe, expect, it } from 'vitest'
import type { BodyWeightEntry } from '../../entities/body-weight'
import { getBodyWeightAnalytics } from './body-weight-analytics'

function entry(date: string, weight: number): BodyWeightEntry {
  return {
    date,
    weight,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  }
}

describe('getBodyWeightAnalytics', () => {
  const now = new Date('2026-08-31T12:00:00.000Z')

  it('calculates the latest measurement and metrics for the last thirty days', () => {
    const analytics = getBodyWeightAnalytics(
      [
        entry('2026-07-31', 80),
        entry('2026-08-02', 79),
        entry('2026-08-15', 78.5),
        entry('2026-08-31', 78),
      ],
      now,
    )

    expect(analytics.latest?.weight).toBe(78)
    expect(analytics.recentEntries.map(({ date }) => date)).toEqual([
      '2026-08-02',
      '2026-08-15',
      '2026-08-31',
    ])
    expect(analytics.change).toBe(-1)
    expect(analytics.minimum).toBe(78)
    expect(analytics.maximum).toBe(79)
  })

  it('does not calculate a change from one measurement', () => {
    const analytics = getBodyWeightAnalytics([entry('2026-08-31', 78)], now)

    expect(analytics.change).toBeUndefined()
  })
})
