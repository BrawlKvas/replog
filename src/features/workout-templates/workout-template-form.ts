import { z } from 'zod'

export const workoutTemplateFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Укажите название шаблона').max(120),
    exercises: z
      .array(
        z.object({
          exerciseId: z.string().min(1, 'Выберите упражнение'),
          sets: z.coerce
            .number<number>()
            .int('Количество подходов должно быть целым числом')
            .min(1, 'Добавьте хотя бы один подход'),
        }),
      )
      .min(1, 'Добавьте хотя бы одно упражнение'),
  })
  .refine(
    ({ exercises }) =>
      new Set(exercises.map((exercise) => exercise.exerciseId)).size ===
      exercises.length,
    { message: 'Упражнение уже добавлено в шаблон', path: ['exercises'] },
  )

export type WorkoutTemplateFormValues = z.infer<
  typeof workoutTemplateFormSchema
>

export type WorkoutTemplateInput = WorkoutTemplateFormValues

export function createWorkoutTemplateFormValues(template?: {
  name: string
  exercises: WorkoutTemplateFormValues['exercises']
}): WorkoutTemplateFormValues {
  return {
    name: template?.name ?? '',
    exercises: template?.exercises ?? [],
  }
}
