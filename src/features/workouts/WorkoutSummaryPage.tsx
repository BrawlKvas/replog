import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/database'
import type { Exercise } from '../../entities/exercise'
import type { Workout, WorkoutSetResult } from '../../entities/workout'

function formatResult(result: WorkoutSetResult) {
  return `${result.weight} кг x ${result.repetitions}, RIR ${result.rir}, техника ${result.technique}/10`
}

export function WorkoutSummaryPage() {
  const { id } = useParams()
  const [workout, setWorkout] = useState<Workout>()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadState, setLoadState] = useState<
    'error' | 'loading' | 'missing' | 'ready'
  >('loading')

  useEffect(() => {
    if (!id) return

    void Promise.all([db.workouts.get(id), db.exercises.toArray()])
      .then(([storedWorkout, storedExercises]) => {
        if (!storedWorkout || storedWorkout.status !== 'completed') {
          setLoadState('missing')
          return
        }

        setWorkout(storedWorkout)
        setExercises(storedExercises)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [id])

  if (loadState === 'loading') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 text-[#657067] sm:px-8">
        Загружаем итоги тренировки...
      </main>
    )
  }

  if (loadState === 'error') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Не удалось загрузить итоги</h1>
        <Link className="mt-4 inline-block font-bold text-[#173d2a]" to="/">
          На главную
        </Link>
      </main>
    )
  }

  if (loadState === 'missing' || !workout) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Итоги тренировки не найдены</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/workout-templates"
        >
          Вернуться к шаблонам
        </Link>
      </main>
    )
  }

  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  )

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="text-center">
        <CheckCircle2
          className="mx-auto text-[#537441]"
          aria-hidden="true"
          size={42}
        />
        <p className="mt-4 text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
          Тренировка завершена
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
          Отличная работа
        </h1>
      </header>

      <section className="mt-10 space-y-5">
        {workout.exercises.map((workoutExercise) => (
          <article
            className="rounded-2xl border border-[#dce1d5] bg-white/70 p-4"
            key={workoutExercise.id}
          >
            <h2 className="font-bold">
              {exerciseById.get(workoutExercise.exerciseId)?.name ??
                'Упражнение удалено'}
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-[#526056]">
              {workoutExercise.sets.map((result, index) => (
                <li className="flex gap-3" key={index}>
                  <span className="font-bold text-[#173d2a]">{index + 1}.</span>
                  <span>{formatResult(result)}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <Link
        className="mt-10 block rounded-xl bg-[#173d2a] px-5 py-3 text-center font-bold text-white"
        to="/workout-templates"
      >
        К шаблонам тренировок
      </Link>
    </main>
  )
}
