import {
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  isValid,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Workout } from '../../entities/workout'

const weekOptions = { weekStartsOn: 1 } as const

export type RegularityWeek = {
  startAt: Date
  label: string
  range: string
  workouts: number
}

export type RegularityAnalytics = {
  weeks: RegularityWeek[]
  totalWorkouts: number
  averageWorkoutsPerWeek: number
  currentStreakWeeks: number
  longestBreakDays?: number
  lastWorkoutAt?: Date
  mostActiveWeek?: RegularityWeek
}

function getCompletedAt(workout: Workout): Date | undefined {
  if (workout.status !== 'completed' || !workout.completedAt) return undefined

  const completedAt = new Date(workout.completedAt)
  return isValid(completedAt) ? completedAt : undefined
}

export function getRegularityAnalytics(
  workouts: Workout[],
  now = new Date(),
): RegularityAnalytics {
  const currentWeekStart = startOfWeek(now, weekOptions)
  const firstWeekStart = subWeeks(currentWeekStart, 11)
  const nextWeekStart = addWeeks(currentWeekStart, 1)
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const startAt = addWeeks(firstWeekStart, index)

    return {
      startAt,
      label: format(startAt, 'd MMM', { locale: ru }),
      range: `${format(startAt, 'd MMMM', { locale: ru })} - ${format(subDays(addWeeks(startAt, 1), 1), 'd MMMM', { locale: ru })}`,
      workouts: 0,
    }
  })
  const completedDates = workouts
    .map(getCompletedAt)
    .filter((completedAt): completedAt is Date => completedAt !== undefined)
    .filter(
      (completedAt) =>
        completedAt >= firstWeekStart && completedAt < nextWeekStart,
    )
    .sort((first, second) => first.getTime() - second.getTime())

  for (const completedAt of completedDates) {
    const weekIndex = differenceInCalendarWeeks(
      startOfWeek(completedAt, weekOptions),
      firstWeekStart,
      weekOptions,
    )
    weeks[weekIndex].workouts += 1
  }

  let currentStreakWeeks = 0
  for (const week of [...weeks].reverse()) {
    if (week.workouts === 0) break
    currentStreakWeeks += 1
  }

  const longestBreakDays = completedDates.reduce<number | undefined>(
    (longest, completedAt, index) => {
      if (index === 0) return longest

      const breakDays = differenceInCalendarDays(
        completedAt,
        completedDates[index - 1],
      )
      return Math.max(longest ?? 0, breakDays)
    },
    undefined,
  )
  const totalWorkouts = completedDates.length
  const mostActiveWeek = weeks.reduce<RegularityWeek | undefined>(
    (mostActive, week) =>
      week.workouts > (mostActive?.workouts ?? 0) ? week : mostActive,
    undefined,
  )

  return {
    weeks,
    totalWorkouts,
    averageWorkoutsPerWeek: totalWorkouts / weeks.length,
    currentStreakWeeks,
    longestBreakDays,
    lastWorkoutAt: completedDates.at(-1),
    mostActiveWeek,
  }
}
