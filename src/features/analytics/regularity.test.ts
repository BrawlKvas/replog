import { describe, expect, it } from 'vitest'
import type { Workout } from '../../entities/workout'
import { getRegularityAnalytics } from './regularity'

function createWorkout(id: string, completedAt: string): Workout {
  return {
    id,
    templateId: 'template',
    status: 'completed',
    exercises: [],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    startedAt: completedAt,
    completedAt,
  }
}

describe('getRegularityAnalytics', () => {
  it('groups completed workouts into the last twelve Monday-starting weeks', () => {
    const analytics = getRegularityAnalytics(
      [
        createWorkout('first', '2026-06-01T12:00:00.000Z'),
        createWorkout('second', '2026-08-18T12:00:00.000Z'),
        createWorkout('third', '2026-08-19T12:00:00.000Z'),
        createWorkout('future', '2026-08-24T12:00:00.000Z'),
      ],
      new Date('2026-08-19T12:00:00.000Z'),
    )

    expect(analytics.weeks).toHaveLength(12)
    expect(analytics.weeks[0].workouts).toBe(1)
    expect(analytics.weeks.at(-1)?.workouts).toBe(2)
    expect(analytics.totalWorkouts).toBe(3)
    expect(analytics.averageWorkoutsPerWeek).toBe(0.25)
    expect(analytics.currentStreakWeeks).toBe(1)
  })

  it('calculates the longest gap and a consecutive current-week streak', () => {
    const analytics = getRegularityAnalytics(
      [
        createWorkout('first', '2026-08-03T12:00:00.000Z'),
        createWorkout('second', '2026-08-12T12:00:00.000Z'),
        createWorkout('third', '2026-08-17T12:00:00.000Z'),
        createWorkout('fourth', '2026-08-19T12:00:00.000Z'),
      ],
      new Date('2026-08-19T12:00:00.000Z'),
    )

    expect(analytics.longestBreakDays).toBe(9)
    expect(analytics.currentStreakWeeks).toBe(3)
    expect(analytics.mostActiveWeek?.workouts).toBe(2)
    expect(analytics.lastWorkoutAt?.toISOString()).toBe(
      '2026-08-19T12:00:00.000Z',
    )
  })

  it('does not create a most active week without completed workouts', () => {
    const analytics = getRegularityAnalytics(
      [],
      new Date('2026-08-19T12:00:00.000Z'),
    )

    expect(analytics.totalWorkouts).toBe(0)
    expect(analytics.currentStreakWeeks).toBe(0)
    expect(analytics.longestBreakDays).toBeUndefined()
    expect(analytics.mostActiveWeek).toBeUndefined()
  })
})
