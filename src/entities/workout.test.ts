import { describe, expect, it } from 'vitest'
import {
  getPreviousWorkoutSet,
  isWorkoutSetComplete,
  type Workout,
  type WorkoutSetResult,
} from './workout'

const completeSet: WorkoutSetResult = {
  weight: 80,
  repetitions: 8,
  rir: 2,
  technique: 8,
}

function createCompletedWorkout(
  id: string,
  completedAt: string,
  sets: WorkoutSetResult[],
): Workout {
  return {
    id,
    templateId: 'template',
    status: 'completed',
    exercises: [{ id: `${id}-exercise`, exerciseId: 'squat', sets }],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    startedAt: completedAt,
    completedAt,
  }
}

describe('isWorkoutSetComplete', () => {
  it('requires all result fields and a technique score from 1 to 10', () => {
    expect(isWorkoutSetComplete(completeSet)).toBe(true)
    expect(isWorkoutSetComplete({ ...completeSet, technique: 0 })).toBe(false)
    expect(isWorkoutSetComplete({ ...completeSet, technique: 10.5 })).toBe(
      false,
    )
    expect(isWorkoutSetComplete({ ...completeSet, rir: null })).toBe(false)
  })
})

describe('getPreviousWorkoutSet', () => {
  it('uses the latest completed result for the same exercise and set number', () => {
    const firstSet = { ...completeSet, weight: 70 }
    const secondSet = { ...completeSet, weight: 65 }
    const latestFirstSet = { ...completeSet, weight: 75 }
    const workouts = [
      createCompletedWorkout('older', '2026-08-20T10:00:00.000Z', [
        firstSet,
        secondSet,
      ]),
      createCompletedWorkout('latest', '2026-08-21T10:00:00.000Z', [
        latestFirstSet,
      ]),
    ]

    expect(getPreviousWorkoutSet(workouts, 'squat', 0)).toEqual(latestFirstSet)
    expect(getPreviousWorkoutSet(workouts, 'squat', 1)).toEqual(secondSet)
  })
})
