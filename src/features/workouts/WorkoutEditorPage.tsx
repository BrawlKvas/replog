import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/database'
import { createEmptyWorkoutSet, type Workout } from '../../entities/workout'
import type { Exercise } from '../../entities/exercise'

type Confirmation = {
  title: string
  description: string
  action: () => Promise<void>
  confirmLabel: string
}

export function WorkoutEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout>()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadState, setLoadState] = useState<
    'error' | 'loading' | 'missing' | 'ready'
  >('loading')
  const [newExerciseId, setNewExerciseId] = useState('')
  const [newExerciseSets, setNewExerciseSets] = useState(1)
  const [saveError, setSaveError] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation>()
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (!id) return

    void Promise.all([
      db.workouts.get(id),
      db.exercises.orderBy('name').toArray(),
    ])
      .then(([storedWorkout, storedExercises]) => {
        if (!storedWorkout || storedWorkout.status !== 'active') {
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
        Загружаем тренировку...
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

  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  )
  const selectedExerciseIds = new Set(
    workout.exercises.map((exercise) => exercise.exerciseId),
  )
  const availableExercises = exercises.filter(
    (exercise) => !selectedExerciseIds.has(exercise.id),
  )

  const saveWorkout = async (nextWorkout: Workout) => {
    setSaveError('')
    setWorkout(nextWorkout)
    try {
      await db.workouts.put(nextWorkout)
    } catch {
      setSaveError('Не удалось сохранить изменения. Попробуйте ещё раз.')
    }
  }

  const getPositionFor = (nextExercises: Workout['exercises']) => {
    const currentExerciseId =
      workout.exercises[workout.currentExerciseIndex]?.id
    const currentExerciseIndex = Math.max(
      0,
      nextExercises.findIndex((exercise) => exercise.id === currentExerciseId),
    )
    const currentSetIndex = Math.min(
      workout.currentSetIndex,
      nextExercises[currentExerciseIndex].sets.length - 1,
    )

    return { currentExerciseIndex, currentSetIndex }
  }

  const addExercise = () => {
    if (!newExerciseId || newExerciseSets < 1) return

    void saveWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: crypto.randomUUID(),
          exerciseId: newExerciseId,
          sets: Array.from({ length: newExerciseSets }, createEmptyWorkoutSet),
        },
      ],
    })
    setNewExerciseId('')
    setNewExerciseSets(1)
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= workout.exercises.length) return

    const nextExercises = [...workout.exercises]
    const [exercise] = nextExercises.splice(index, 1)
    nextExercises.splice(nextIndex, 0, exercise)
    void saveWorkout({
      ...workout,
      exercises: nextExercises,
      ...getPositionFor(nextExercises),
    })
  }

  const changeSets = (index: number, sets: number) => {
    if (!Number.isInteger(sets) || sets < 1) return

    const workoutExercise = workout.exercises[index]
    if (sets === workoutExercise.sets.length) return

    const apply = async () => {
      const nextExercises = workout.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex !== index
          ? exercise
          : {
              ...exercise,
              sets:
                sets > exercise.sets.length
                  ? [
                      ...exercise.sets,
                      ...Array.from(
                        { length: sets - exercise.sets.length },
                        createEmptyWorkoutSet,
                      ),
                    ]
                  : exercise.sets.slice(0, sets),
            },
      )
      await saveWorkout({
        ...workout,
        exercises: nextExercises,
        ...getPositionFor(nextExercises),
      })
    }

    const removedSets = workoutExercise.sets.slice(sets)
    const removesResult = removedSets.some(
      (set) =>
        set.weight !== null ||
        set.repetitions !== null ||
        set.rir !== null ||
        set.technique !== null,
    )
    if (removesResult) {
      setConfirmation({
        title: 'Уменьшить число подходов?',
        description: 'Результаты удалённых подходов будут потеряны.',
        confirmLabel: 'Уменьшить',
        action: apply,
      })
      return
    }

    void apply()
  }

  const replaceExercise = (index: number, exerciseId: string) => {
    const workoutExercise = workout.exercises[index]
    if (exerciseId === workoutExercise.exerciseId) return

    const apply = async () => {
      const nextExercises = workout.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              exerciseId,
              sets: exercise.sets.map(() => createEmptyWorkoutSet()),
            }
          : exercise,
      )
      await saveWorkout({ ...workout, exercises: nextExercises })
    }

    const replacesResult = workoutExercise.sets.some(
      (set) =>
        set.weight !== null ||
        set.repetitions !== null ||
        set.rir !== null ||
        set.technique !== null,
    )
    if (replacesResult) {
      setConfirmation({
        title: 'Заменить упражнение?',
        description: 'Все результаты этого упражнения будут удалены.',
        confirmLabel: 'Заменить',
        action: apply,
      })
      return
    }

    void apply()
  }

  const removeExercise = (index: number) => {
    if (workout.exercises.length === 1) return

    setConfirmation({
      title: 'Удалить упражнение?',
      description: 'Все результаты этого упражнения будут удалены.',
      confirmLabel: 'Удалить',
      action: async () => {
        const nextExercises = workout.exercises.filter(
          (_, exerciseIndex) => exerciseIndex !== index,
        )
        await saveWorkout({
          ...workout,
          exercises: nextExercises,
          ...getPositionFor(nextExercises),
        })
      },
    })
  }

  const cancelWorkout = () => {
    setConfirmation({
      title: 'Отменить тренировку?',
      description: 'Черновик и все введённые результаты будут удалены.',
      confirmLabel: 'Отменить тренировку',
      action: async () => {
        await db.workouts.delete(workout.id)
        navigate('/workout-templates', { replace: true })
      },
    })
  }

  const confirm = async () => {
    if (!confirmation) return

    setIsConfirming(true)
    try {
      await confirmation.action()
      setConfirmation(undefined)
    } catch {
      setSaveError('Не удалось сохранить изменения. Попробуйте ещё раз.')
      setConfirmation(undefined)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <Link
          className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
          aria-label="Вернуться к тренировке"
          to={`/workouts/${workout.id}`}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
            Текущая тренировка
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            План тренировки
          </h1>
        </div>
      </header>

      <section className="mt-8 space-y-3">
        {workout.exercises.map((workoutExercise, index) => {
          const selectedExercise = exerciseById.get(workoutExercise.exerciseId)

          return (
            <article
              className="rounded-2xl border border-[#dce1d5] bg-white/70 p-4"
              key={workoutExercise.id}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8efdf] text-sm font-bold text-[#456236]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <label>
                    <span className="text-sm font-bold">Упражнение</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-3 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
                      aria-label={`Заменить ${selectedExercise?.name ?? 'упражнение'}`}
                      value={workoutExercise.exerciseId}
                      onChange={(event) =>
                        replaceExercise(index, event.target.value)
                      }
                    >
                      {exercises
                        .filter(
                          (exercise) =>
                            exercise.id === workoutExercise.exerciseId ||
                            !selectedExerciseIds.has(exercise.id),
                        )
                        .map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <label className="w-32">
                  <span className="text-sm font-bold">Подходы</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-3 py-3 text-center outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
                    inputMode="numeric"
                    min="1"
                    type="number"
                    value={workoutExercise.sets.length}
                    onChange={(event) =>
                      changeSets(index, Number(event.target.value))
                    }
                  />
                </label>
                <div className="flex gap-1">
                  <button
                    className="grid size-10 place-items-center rounded-xl text-[#173d2a] disabled:opacity-35"
                    type="button"
                    aria-label="Переместить выше"
                    disabled={index === 0}
                    onClick={() => moveExercise(index, -1)}
                  >
                    <ChevronUp aria-hidden="true" size={20} />
                  </button>
                  <button
                    className="grid size-10 place-items-center rounded-xl text-[#173d2a] disabled:opacity-35"
                    type="button"
                    aria-label="Переместить ниже"
                    disabled={index === workout.exercises.length - 1}
                    onClick={() => moveExercise(index, 1)}
                  >
                    <ChevronDown aria-hidden="true" size={20} />
                  </button>
                  <button
                    className="grid size-10 place-items-center rounded-xl text-[#b42318] disabled:opacity-35"
                    type="button"
                    aria-label="Удалить упражнение из тренировки"
                    disabled={workout.exercises.length === 1}
                    onClick={() => removeExercise(index)}
                  >
                    <Trash2 aria-hidden="true" size={19} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-[#b7c1b2] p-4">
        <h2 className="font-bold">Добавить упражнение</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
          <select
            className="rounded-xl border border-[#cdd5c8] bg-white px-3 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
            aria-label="Новое упражнение"
            value={newExerciseId}
            onChange={(event) => setNewExerciseId(event.target.value)}
          >
            <option value="">Выберите упражнение</option>
            {availableExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <label>
            <span className="sr-only">Подходы нового упражнения</span>
            <input
              className="w-full rounded-xl border border-[#cdd5c8] bg-white px-3 py-3 text-center outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              inputMode="numeric"
              min="1"
              type="number"
              value={newExerciseSets}
              onChange={(event) =>
                setNewExerciseSets(Number(event.target.value))
              }
            />
          </label>
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 font-bold text-[#173d2a] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!newExerciseId || newExerciseSets < 1}
            onClick={addExercise}
          >
            <Plus aria-hidden="true" size={18} />
            Добавить
          </button>
        </div>
      </section>

      {saveError && (
        <p className="mt-4 text-sm text-[#b42318]" role="alert">
          {saveError}
        </p>
      )}

      <div className="mt-10 grid gap-3">
        <Link
          className="rounded-xl bg-[#173d2a] px-5 py-3 text-center font-bold text-white"
          to={`/workouts/${workout.id}`}
        >
          Продолжить тренировку
        </Link>
        <button
          className="rounded-xl px-5 py-3 font-bold text-[#b42318]"
          type="button"
          onClick={cancelWorkout}
        >
          Отменить тренировку
        </button>
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-[#152019]/45 p-5">
          <section
            className="w-full max-w-sm rounded-2xl bg-[#f5f5ef] p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="workout-confirmation-title"
          >
            <h2 id="workout-confirmation-title" className="text-xl font-black">
              {confirmation.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#657067]">
              {confirmation.description}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 font-bold"
                type="button"
                disabled={isConfirming}
                onClick={() => setConfirmation(undefined)}
              >
                Назад
              </button>
              <button
                className="rounded-xl bg-[#b42318] px-4 py-3 font-bold text-white disabled:opacity-70"
                type="button"
                disabled={isConfirming}
                onClick={() => void confirm()}
              >
                {isConfirming ? 'Сохраняем...' : confirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
