import { z } from 'zod'

export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название упражнения').max(120),
  description: z.string().trim().max(2_000, 'Описание слишком длинное'),
  tags: z.string(),
})

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>

export type ExerciseInput = Omit<ExerciseFormValues, 'tags'> & {
  tags: string[]
}

export function normalizeTags(value: string): string[] {
  const seen = new Set<string>()

  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      const normalizedTag = tag.toLocaleLowerCase()

      if (!normalizedTag || seen.has(normalizedTag)) return false

      seen.add(normalizedTag)
      return true
    })
}

export function createExerciseFormValues(exercise?: {
  name: string
  description?: string
  tags: string[]
}): ExerciseFormValues {
  return {
    name: exercise?.name ?? '',
    description: exercise?.description ?? '',
    tags: exercise?.tags.join(', ') ?? '',
  }
}
