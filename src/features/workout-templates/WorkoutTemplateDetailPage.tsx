import { ArrowLeft, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/database'
import type { Exercise } from '../../entities/exercise'
import type { WorkoutTemplate } from '../../entities/workout-template'

type LoadState = 'error' | 'loading' | 'missing' | 'ready'

export function WorkoutTemplateDetailPage() {
  const { id } = useParams()
  const [template, setTemplate] = useState<WorkoutTemplate>()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    if (!id) return

    void Promise.all([db.workoutTemplates.get(id), db.exercises.toArray()])
      .then(([storedTemplate, storedExercises]) => {
        if (!storedTemplate) {
          setLoadState('missing')
          return
        }

        setTemplate(storedTemplate)
        setExercises(storedExercises)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [id])

  if (loadState === 'loading') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 text-[#657067] sm:px-8">
        Загружаем шаблон тренировки...
      </main>
    )
  }

  if (loadState === 'error') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Не удалось загрузить шаблон</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/workout-templates"
        >
          Вернуться к шаблонам тренировок
        </Link>
      </main>
    )
  }

  if (loadState === 'missing' || !template) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Шаблон тренировки не найден</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/workout-templates"
        >
          Вернуться к шаблонам тренировок
        </Link>
      </main>
    )
  }

  const exerciseById = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  )
  const totalSets = template.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  )

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
            aria-label="Вернуться к шаблонам тренировок"
            to="/workout-templates"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
              Шаблон тренировки
            </p>
            <h1 className="text-2xl font-black tracking-[-0.04em]">
              {template.name}
            </h1>
          </div>
        </div>
        <Link
          className="grid size-11 place-items-center rounded-xl bg-[#173d2a] text-white"
          aria-label="Редактировать шаблон"
          to={`/workout-templates/${template.id}/edit`}
        >
          <Pencil aria-hidden="true" size={20} />
        </Link>
      </header>

      <section className="mt-8">
        <p className="text-sm text-[#657067]">
          {template.exercises.length} упражн., {totalSets} подходов
        </p>
        <ol className="mt-4 space-y-3">
          {template.exercises.map((templateExercise, index) => {
            const exercise = exerciseById.get(templateExercise.exerciseId)

            return (
              <li
                className="flex items-center gap-4 rounded-2xl border border-[#dce1d5] bg-white/70 p-4"
                key={templateExercise.exerciseId}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8efdf] text-sm font-bold text-[#456236]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {exercise?.name ?? 'Упражнение удалено'}
                  </span>
                  <span className="mt-1 block text-sm text-[#657067]">
                    {templateExercise.sets} подходов
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
