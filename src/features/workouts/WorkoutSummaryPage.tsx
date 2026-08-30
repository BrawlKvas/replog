import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/database'
import type { Exercise } from '../../entities/exercise'
import {
  formatWorkoutDuration,
  type Workout,
  type WorkoutSetResult,
} from '../../entities/workout'

function formatResult(result: WorkoutSetResult) {
  return `${result.weight} кг x ${result.repetitions}, RIR ${result.rir}, техника ${result.technique}/10`
}

export function WorkoutSummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout>()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadState, setLoadState] = useState<
    'error' | 'loading' | 'missing' | 'ready'
  >('loading')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const deleteWorkout = async () => {
    setIsDeleting(true)
    setDeleteError('')
    try {
      await db.workouts.delete(workout.id)
      navigate('/workouts/history', { replace: true })
    } catch {
      setDeleteError('Не удалось удалить тренировку. Попробуйте ещё раз.')
      setIsDeleteConfirmationOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

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

      <section className="mt-8 rounded-2xl bg-[#e8efdf] p-4 text-center">
        <h2 className="text-sm font-bold text-[#456236]">Время тренировки</h2>
        <p className="mt-1 text-2xl font-black text-[#173d2a]">
          {formatWorkoutDuration(workout.startedAt, workout.completedAt)}
        </p>
      </section>

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
      <Link
        className="mt-4 block text-center text-sm font-bold text-[#173d2a]"
        to="/workouts/history"
      >
        К истории тренировок
      </Link>
      {deleteError && (
        <p className="mt-4 text-sm text-[#b42318]" role="alert">
          {deleteError}
        </p>
      )}
      <button
        className="mt-6 w-full rounded-xl px-5 py-3 font-bold text-[#b42318]"
        type="button"
        onClick={() => setIsDeleteConfirmationOpen(true)}
      >
        Удалить тренировку
      </button>

      {isDeleteConfirmationOpen && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-[#152019]/45 p-5">
          <section
            className="w-full max-w-sm rounded-2xl bg-[#f5f5ef] p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-workout-title"
          >
            <h2 id="delete-workout-title" className="text-xl font-black">
              Удалить тренировку?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#657067]">
              Тренировка и все её результаты будут безвозвратно удалены с этого
              устройства.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 font-bold"
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteConfirmationOpen(false)}
              >
                Назад
              </button>
              <button
                className="rounded-xl bg-[#b42318] px-4 py-3 font-bold text-white disabled:opacity-70"
                type="button"
                disabled={isDeleting}
                onClick={() => void deleteWorkout()}
              >
                {isDeleting ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
