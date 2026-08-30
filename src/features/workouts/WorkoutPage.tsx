import { ArrowLeft, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/database'
import {
  formatWorkoutDuration,
  getPreviousWorkoutSet,
  isWorkoutComplete,
  type Workout,
  type WorkoutSetResult,
} from '../../entities/workout'
import type { Exercise } from '../../entities/exercise'

type LoadState = 'completed' | 'error' | 'loading' | 'missing' | 'ready'
type ResultField = keyof WorkoutSetResult

function formatResult(result: WorkoutSetResult) {
  return `${result.weight} кг x ${result.repetitions}, RIR ${result.rir}, техника ${result.technique}/10`
}

function ExerciseThumbnail({ image }: { image: Blob }) {
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(image)

    if (imageRef.current) imageRef.current.src = url

    return () => URL.revokeObjectURL(url)
  }, [image])

  return (
    <img
      ref={imageRef}
      className="size-20 shrink-0 rounded-2xl object-cover"
      alt=""
    />
  )
}

export function WorkoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout>()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<Workout[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [saveError, setSaveError] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date().toISOString())
  const isActiveWorkout = workout?.status === 'active'

  useEffect(() => {
    if (!id) return

    let isMounted = true

    void Promise.all([
      db.workouts.get(id),
      db.exercises.toArray(),
      db.workouts.where('status').equals('completed').toArray(),
    ])
      .then(([storedWorkout, storedExercises, storedCompletedWorkouts]) => {
        if (!isMounted) return

        if (!storedWorkout) {
          setLoadState('missing')
          return
        }

        if (storedWorkout.status === 'completed') {
          setLoadState('completed')
          return
        }

        setWorkout(storedWorkout)
        setExercises(storedExercises)
        setCompletedWorkouts(storedCompletedWorkouts)
        setLoadState('ready')
      })
      .catch(() => {
        if (isMounted) setLoadState('error')
      })

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (!isActiveWorkout) return

    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date().toISOString())
    }, 1_000)

    return () => window.clearInterval(intervalId)
  }, [isActiveWorkout])

  if (loadState === 'loading') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 text-[#657067] sm:px-8">
        Загружаем тренировку...
      </main>
    )
  }

  if (loadState === 'completed' && id) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Тренировка уже завершена</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to={`/workouts/${id}/summary`}
        >
          Открыть итоги
        </Link>
      </main>
    )
  }

  if (loadState === 'error') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Не удалось загрузить тренировку</h1>
        <Link className="mt-4 inline-block font-bold text-[#173d2a]" to="/">
          На главную
        </Link>
      </main>
    )
  }

  if (loadState === 'missing' || !workout) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Тренировка не найдена</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/workout-templates"
        >
          Вернуться к шаблонам
        </Link>
      </main>
    )
  }

  const currentExercise = workout.exercises[workout.currentExerciseIndex]
  const currentResult = currentExercise?.sets[workout.currentSetIndex]

  if (!currentExercise || !currentResult) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">В тренировке нет подходов</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to={`/workouts/${workout.id}/edit`}
        >
          Изменить тренировку
        </Link>
      </main>
    )
  }

  const exercise = exercises.find(
    (storedExercise) => storedExercise.id === currentExercise.exerciseId,
  )
  const previousResult = getPreviousWorkoutSet(
    completedWorkouts,
    currentExercise.exerciseId,
    workout.currentSetIndex,
  )
  const isFirstSet =
    workout.currentExerciseIndex === 0 && workout.currentSetIndex === 0

  const saveWorkout = (nextWorkout: Workout) => {
    setWorkout(nextWorkout)
    void db.workouts.put(nextWorkout).catch(() => {
      setSaveError('Не удалось сохранить результат. Попробуйте ещё раз.')
    })
  }

  const updateResult = (field: ResultField, rawValue: string) => {
    const value = rawValue === '' ? null : Number(rawValue)
    const validValue = value === null || Number.isFinite(value) ? value : null
    const nextWorkout: Workout = {
      ...workout,
      exercises: workout.exercises.map((workoutExercise, exerciseIndex) =>
        exerciseIndex !== workout.currentExerciseIndex
          ? workoutExercise
          : {
              ...workoutExercise,
              sets: workoutExercise.sets.map((set, setIndex) =>
                setIndex === workout.currentSetIndex
                  ? { ...set, [field]: validValue }
                  : set,
              ),
            },
      ),
    }
    setSaveError('')
    saveWorkout(nextWorkout)
  }

  const goBack = () => {
    if (isFirstSet) return

    const previousExerciseIndex =
      workout.currentSetIndex === 0
        ? workout.currentExerciseIndex - 1
        : workout.currentExerciseIndex
    const previousSetIndex =
      workout.currentSetIndex === 0
        ? workout.exercises[previousExerciseIndex].sets.length - 1
        : workout.currentSetIndex - 1

    saveWorkout({
      ...workout,
      currentExerciseIndex: previousExerciseIndex,
      currentSetIndex: previousSetIndex,
    })
  }

  const goNext = async () => {
    setSaveError('')
    const isLastSet =
      workout.currentSetIndex === currentExercise.sets.length - 1
    const isLastExercise =
      workout.currentExerciseIndex === workout.exercises.length - 1

    try {
      if (isLastSet && isLastExercise) {
        if (!isWorkoutComplete(workout)) {
          setSaveError(
            'Заполните все поля во всех подходах, чтобы завершить тренировку.',
          )
          return
        }

        const completedWorkout: Workout = {
          ...workout,
          status: 'completed',
          completedAt: new Date().toISOString(),
        }
        await db.workouts.put(completedWorkout)
        navigate(`/workouts/${workout.id}/summary`, { replace: true })
        return
      }

      const nextWorkout: Workout = isLastSet
        ? {
            ...workout,
            currentExerciseIndex: workout.currentExerciseIndex + 1,
            currentSetIndex: 0,
          }
        : { ...workout, currentSetIndex: workout.currentSetIndex + 1 }
      await db.workouts.put(nextWorkout)
      setWorkout(nextWorkout)
    } catch {
      setSaveError('Не удалось сохранить результат. Попробуйте ещё раз.')
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <Link
          className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
          aria-label="Вернуться к шаблонам тренировок"
          to="/workout-templates"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <Link
          className="flex items-center gap-2 rounded-xl border border-[#cdd5c8] bg-white px-3 py-2 text-sm font-bold text-[#173d2a]"
          to={`/workouts/${workout.id}/edit`}
        >
          <Settings aria-hidden="true" size={18} />
          План тренировки
        </Link>
      </header>

      <section className="mt-6 rounded-2xl bg-[#e8efdf] p-4">
        <h2 className="text-sm font-bold text-[#456236]">Время тренировки</h2>
        <p className="mt-1 text-xl font-black text-[#173d2a]">
          {formatWorkoutDuration(workout.startedAt, currentTime)}
        </p>
      </section>

      <section className="mt-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
          Упражнение {workout.currentExerciseIndex + 1} из{' '}
          {workout.exercises.length}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <h1 className="min-w-0 flex-1 text-3xl font-black tracking-[-0.04em]">
            {exercise?.name ?? 'Упражнение удалено'}
          </h1>
          {exercise && <ExerciseThumbnail image={exercise.image} />}
        </div>
        <p className="mt-3 text-lg text-[#657067]">
          Подход {workout.currentSetIndex + 1} из {currentExercise.sets.length}
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-[#e8efdf] p-4" aria-live="polite">
        <h2 className="text-sm font-bold text-[#456236]">
          Предыдущий результат
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#456236]">
          {previousResult ? formatResult(previousResult) : 'Нет данных'}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black">Текущий результат</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <span className="text-sm font-bold">Вес, кг</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 text-lg outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              inputMode="decimal"
              type="number"
              value={currentResult.weight ?? ''}
              onChange={(event) => updateResult('weight', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-bold">Повторения</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 text-lg outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              inputMode="decimal"
              type="number"
              value={currentResult.repetitions ?? ''}
              onChange={(event) =>
                updateResult('repetitions', event.target.value)
              }
            />
          </label>
          <label>
            <span className="text-sm font-bold">RIR</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 text-lg outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              inputMode="decimal"
              type="number"
              value={currentResult.rir ?? ''}
              onChange={(event) => updateResult('rir', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-bold">Техника, 1–10</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 text-lg outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              inputMode="numeric"
              min="1"
              max="10"
              step="1"
              type="number"
              value={currentResult.technique ?? ''}
              onChange={(event) =>
                updateResult('technique', event.target.value)
              }
            />
          </label>
        </div>
      </section>

      {saveError && (
        <p className="mt-4 text-sm text-[#b42318]" role="alert">
          {saveError}
        </p>
      )}

      <footer className="mt-10 grid grid-cols-2 gap-3">
        <button
          className="rounded-xl border border-[#cdd5c8] bg-white px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={goBack}
          disabled={isFirstSet}
        >
          Назад
        </button>
        <button
          className="rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white"
          type="button"
          onClick={() => void goNext()}
        >
          {workout.currentExerciseIndex === workout.exercises.length - 1 &&
          workout.currentSetIndex === currentExercise.sets.length - 1
            ? 'Завершить'
            : 'Далее'}
        </button>
      </footer>
    </main>
  )
}
