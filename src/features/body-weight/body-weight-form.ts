import { format, isValid, parseISO } from 'date-fns'
import { z } from 'zod'
import type { BodyWeightEntry } from '../../entities/body-weight'

function isCalendarDate(value: string): boolean {
  const date = parseISO(value)
  return isValid(date) && format(date, 'yyyy-MM-dd') === value
}

export function createBodyWeightFormSchema(now = new Date()) {
  const today = format(now, 'yyyy-MM-dd')

  return z.object({
    date: z
      .string()
      .refine(isCalendarDate, 'Укажите корректную дату')
      .refine((value) => value <= today, 'Нельзя указать будущую дату'),
    weight: z
      .number({ error: 'Укажите вес' })
      .finite('Укажите корректный вес')
      .positive('Вес должен быть больше нуля')
      .max(500, 'Укажите вес не больше 500 кг'),
  })
}

export type BodyWeightFormValues = z.infer<
  ReturnType<typeof createBodyWeightFormSchema>
>

export function createBodyWeightFormValues(
  entry?: BodyWeightEntry,
  now = new Date(),
): BodyWeightFormValues {
  return {
    date: entry?.date ?? format(now, 'yyyy-MM-dd'),
    weight: entry?.weight ?? 0,
  }
}
