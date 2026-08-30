import { ArrowLeft, CalendarDays } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import type { Workout } from '../entities/workout'
import { getRegularityAnalytics } from '../features/analytics/regularity'

type LoadState = 'error' | 'loading' | 'ready'

function formatAverage(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value)
}

export function AnalyticsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>()
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    let isMounted = true

    void db.workouts
      .where('status')
      .equals('completed')
      .toArray()
      .then((storedWorkouts) => {
        if (!isMounted) return
        setWorkouts(storedWorkouts)
        setLoadState('ready')
      })
      .catch(() => {
        if (isMounted) setLoadState('error')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const analytics = workouts ? getRegularityAnalytics(workouts) : undefined

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <Link
          className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
          aria-label="Вернуться на главную"
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
            Аналитика
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            Регулярность
          </h1>
        </div>
      </header>

      <section className="mt-8" aria-live="polite">
        {loadState === 'loading' && (
          <p className="text-[#657067]">Загружаем аналитику...</p>
        )}
        {loadState === 'error' && (
          <p className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            Не удалось загрузить аналитику.
          </p>
        )}
        {loadState === 'ready' && analytics?.totalWorkouts === 0 && (
          <div className="rounded-2xl border border-dashed border-[#b7c1b2] px-6 py-14 text-center">
            <CalendarDays
              className="mx-auto text-[#537441]"
              aria-hidden="true"
              size={28}
            />
            <h2 className="mt-4 text-xl font-black">Тренировок пока нет</h2>
            <p className="mt-3 text-sm leading-6 text-[#657067]">
              Завершите первую тренировку, чтобы увидеть свой ритм.
            </p>
          </div>
        )}
        {analytics && analytics.totalWorkouts > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Metric
                label="Тренировок"
                value={String(analytics.totalWorkouts)}
              />
              <Metric
                label="Серия"
                value={`${analytics.currentStreakWeeks} нед.`}
              />
              <Metric
                label="Последняя"
                value={
                  analytics.lastWorkoutAt
                    ? formatDistanceToNow(analytics.lastWorkoutAt, {
                        addSuffix: true,
                        locale: ru,
                      })
                    : 'Нет данных'
                }
              />
            </div>

            <section className="rounded-2xl border border-[#dce1d5] bg-white/70 p-4 sm:p-5">
              <div>
                <h2 className="font-bold">Тренировки по неделям</h2>
                <p className="mt-1 text-sm text-[#657067]">
                  Последние 12 недель, с понедельника по воскресенье
                </p>
              </div>
              <div className="mt-5 h-60" data-testid="regularity-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.weeks}
                    margin={{ top: 8, right: 0, left: -24, bottom: 0 }}
                  >
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      interval={2}
                      tick={{ fill: '#657067', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tick={{ fill: '#657067', fontSize: 11 }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#e8efdf' }}
                      formatter={(value) => [`${value} трен.`, '']}
                      labelFormatter={(_, payload) => payload[0]?.payload.range}
                    />
                    <Bar
                      dataKey="workouts"
                      maxBarSize={28}
                      radius={[6, 6, 0, 0]}
                    >
                      {analytics.weeks.map((week, index) => (
                        <Cell
                          key={week.startAt.toISOString()}
                          fill={
                            index === analytics.weeks.length - 1
                              ? '#173d2a'
                              : '#6d943f'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl bg-[#e8efdf] p-5">
              <h2 className="font-bold">За последние 12 недель</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryItem
                  label="В среднем"
                  value={`${formatAverage(analytics.averageWorkoutsPerWeek)} трен. в неделю`}
                />
                <SummaryItem
                  label="Самая активная неделя"
                  value={
                    analytics.mostActiveWeek
                      ? `${analytics.mostActiveWeek.workouts} трен. (${analytics.mostActiveWeek.range})`
                      : 'Нет данных'
                  }
                />
                <SummaryItem
                  label="Самый длинный перерыв"
                  value={
                    analytics.longestBreakDays === undefined
                      ? 'Недостаточно данных'
                      : `${analytics.longestBreakDays} дн.`
                  }
                />
              </dl>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#e8efdf] p-3">
      <dt className="text-xs font-semibold text-[#537441]">{label}</dt>
      <dd className="mt-2 text-sm font-black tracking-[-0.03em]">{value}</dd>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[#657067]">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  )
}
