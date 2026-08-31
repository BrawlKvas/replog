import { format, isValid, parseISO, subDays } from 'date-fns'
import type { BodyWeightEntry } from '../../entities/body-weight'

export type BodyWeightAnalytics = {
  latest?: BodyWeightEntry
  recentEntries: BodyWeightEntry[]
  change?: number
  minimum?: number
  maximum?: number
}

function isCalendarDate(value: string): boolean {
  const date = parseISO(value)
  return isValid(date) && format(date, 'yyyy-MM-dd') === value
}

export function getBodyWeightAnalytics(
  entries: BodyWeightEntry[],
  now = new Date(),
): BodyWeightAnalytics {
  const today = format(now, 'yyyy-MM-dd')
  const periodStart = format(subDays(now, 29), 'yyyy-MM-dd')
  const sortedEntries = entries
    .filter(
      (entry) =>
        isCalendarDate(entry.date) &&
        entry.date <= today &&
        Number.isFinite(entry.weight) &&
        entry.weight > 0,
    )
    .sort((first, second) => first.date.localeCompare(second.date))
  const recentEntries = sortedEntries.filter(
    (entry) => entry.date >= periodStart,
  )
  const weights = recentEntries.map((entry) => entry.weight)

  return {
    latest: sortedEntries.at(-1),
    recentEntries,
    change:
      recentEntries.length >= 2
        ? recentEntries.at(-1)!.weight - recentEntries[0].weight
        : undefined,
    minimum: weights.length ? Math.min(...weights) : undefined,
    maximum: weights.length ? Math.max(...weights) : undefined,
  }
}
