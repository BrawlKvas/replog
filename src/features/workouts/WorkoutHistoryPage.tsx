import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/database'
import { formatWorkoutDuration, type Workout } from '../../entities/workout'
import type { WorkoutTemplate } from '../../entities/workout-template'

type LoadState = 'error' | 'loading' | 'ready'

function getSetsCount(workout: Workout) {
  return workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  )
}

function formatCompletedAt(completedAt?: string) {
  if (!completedAt) return 'Дата завершения неизвестна'

  return format(new Date(completedAt), 'd MMMM yyyy, HH:mm', { locale: ru })
}

export function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    let isMounted = true

    void Promise.all([
      db.workouts.where('status').equals('completed').toArray(),
      db.workoutTemplates.toArray(),
    ])
      .then(([storedWorkouts, storedTemplates]) => {
        if (!isMounted) return

        setWorkouts(
          storedWorkouts.sort((first, second) =>
            (second.completedAt ?? '').localeCompare(first.completedAt ?? ''),
          ),
        )
        setTemplates(storedTemplates)
        setLoadState('ready')
      })
      .catch(() => {
        if (isMounted) setLoadState('error')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const templateById = new Map(
    templates.map((template) => [template.id, template]),
  )

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
            Дневник
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            История тренировок
          </h1>
        </div>
      </header>

      <section className="mt-8" aria-live="polite">
        {loadState === 'loading' && (
          <p className="text-[#657067]">Загружаем историю тренировок...</p>
        )}
        {loadState === 'error' && (
          <p className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            Не удалось загрузить историю тренировок.
          </p>
        )}
        {loadState === 'ready' && workouts?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#b7c1b2] px-6 py-14 text-center">
            <h2 className="text-xl font-black">Тренировок пока нет</h2>
            <p className="mt-3 text-sm leading-6 text-[#657067]">
              Завершённые тренировки появятся здесь.
            </p>
          </div>
        )}
        {workouts && workouts.length > 0 && (
          <ul className="space-y-3">
            {workouts.map((workout) => {
              const template = templateById.get(workout.templateId)

              return (
                <li key={workout.id}>
                  <Link
                    className="block rounded-2xl border border-[#dce1d5] bg-white/70 p-4 transition hover:border-[#537441]"
                    to={`/workouts/${workout.id}/summary`}
                  >
                    <span className="block text-sm text-[#657067]">
                      {formatCompletedAt(workout.completedAt)}
                    </span>
                    <span className="mt-2 block font-bold">
                      {template?.name ?? 'Шаблон удалён'}
                    </span>
                    <span className="mt-1 block text-sm text-[#657067]">
                      {workout.exercises.length} упражн.,{' '}
                      {getSetsCount(workout)} подходов,{' '}
                      {formatWorkoutDuration(
                        workout.startedAt,
                        workout.completedAt,
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
