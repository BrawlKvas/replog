import { describe, expect, it } from 'vitest'
import {
  createWorkoutTemplateFormValues,
  workoutTemplateFormSchema,
} from './workout-template-form'

describe('workoutTemplateFormSchema', () => {
  it('requires a name and at least one exercise with a positive set count', () => {
    expect(
      workoutTemplateFormSchema.safeParse({ name: '  ', exercises: [] })
        .success,
    ).toBe(false)
    expect(
      workoutTemplateFormSchema.safeParse({
        name: 'Ноги',
        exercises: [{ exerciseId: 'squat', sets: 0 }],
      }).success,
    ).toBe(false)
  })

  it('does not allow an exercise to be added twice', () => {
    expect(
      workoutTemplateFormSchema.safeParse({
        name: 'Ноги',
        exercises: [
          { exerciseId: 'squat', sets: 3 },
          { exerciseId: 'squat', sets: 2 },
        ],
      }).success,
    ).toBe(false)
  })
})

describe('createWorkoutTemplateFormValues', () => {
  it('prepares persisted positions for editing without changing their order', () => {
    expect(
      createWorkoutTemplateFormValues({
        name: 'Верх тела',
        exercises: [
          { exerciseId: 'press', sets: 3 },
          { exerciseId: 'row', sets: 4 },
        ],
      }),
    ).toEqual({
      name: 'Верх тела',
      exercises: [
        { exerciseId: 'press', sets: 3 },
        { exerciseId: 'row', sets: 4 },
      ],
    })
  })
})
