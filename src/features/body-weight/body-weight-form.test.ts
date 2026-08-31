import { describe, expect, it } from 'vitest'
import {
  createBodyWeightFormSchema,
  createBodyWeightFormValues,
} from './body-weight-form'

describe('body-weight form', () => {
  const now = new Date('2026-08-31T12:00:00.000Z')
  const schema = createBodyWeightFormSchema(now)

  it('accepts a past measurement with a positive decimal weight', () => {
    expect(schema.safeParse({ date: '2026-08-30', weight: 76.5 }).success).toBe(
      true,
    )
  })

  it('rejects future dates and non-positive weights', () => {
    expect(schema.safeParse({ date: '2026-09-01', weight: 76.5 }).success).toBe(
      false,
    )
    expect(schema.safeParse({ date: '2026-08-31', weight: 0 }).success).toBe(
      false,
    )
  })

  it('prepares an existing entry for editing', () => {
    expect(
      createBodyWeightFormValues(
        {
          date: '2026-08-30',
          weight: 76.5,
          createdAt: '2026-08-30T10:00:00.000Z',
          updatedAt: '2026-08-30T10:00:00.000Z',
        },
        now,
      ),
    ).toEqual({ date: '2026-08-30', weight: 76.5 })
  })
})
