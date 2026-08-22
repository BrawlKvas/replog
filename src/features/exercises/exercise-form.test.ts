import { describe, expect, it } from 'vitest'
import {
  createExerciseFormValues,
  exerciseFormSchema,
  normalizeTags,
} from './exercise-form'

describe('normalizeTags', () => {
  it('trims tags and removes duplicates without changing display casing', () => {
    expect(normalizeTags(' Ноги, сила, ноги,  , СИЛА, Спина ')).toEqual([
      'Ноги',
      'сила',
      'Спина',
    ])
  })
})

describe('exerciseFormSchema', () => {
  it('requires a non-empty exercise name', () => {
    expect(
      exerciseFormSchema.safeParse({ name: '  ', description: '', tags: '' })
        .success,
    ).toBe(false)
  })
})

describe('createExerciseFormValues', () => {
  it('prepares persisted values for editing', () => {
    expect(
      createExerciseFormValues({
        name: 'Приседания',
        description: 'Со штангой',
        tags: ['Ноги', 'Сила'],
      }),
    ).toEqual({
      name: 'Приседания',
      description: 'Со штангой',
      tags: 'Ноги, Сила',
    })
  })
})
