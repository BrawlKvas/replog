import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/database'
import { createWorkout, type Workout } from '../../entities/workout'
import type { WorkoutTemplate } from '../../entities/workout-template'

function getSetsCount(template: WorkoutTemplate) {
  return template.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  )
}

export function WorkoutTemplateListPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>()
  const [loadError, setLoadError] = useState(false)
  const [startError, setStartError] = useState('')
  const [activeWorkout, setActiveWorkout] = useState<Workout>()
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate>()

  useEffect(() => {
    void db.workoutTemplates
      .orderBy('name')
      .toArray()
      .then(setTemplates)
      .catch(() => setLoadError(true))
  }, [])

  const startWorkout = async (template: WorkoutTemplate) => {
    setStartError('')

    try {
      const storedActiveWorkout = await db.workouts
        .where('status')
        .equals('active')
        .first()
      if (storedActiveWorkout) {
        setActiveWorkout(storedActiveWorkout)
        setSelectedTemplate(template)
        return
      }

      const workout = createWorkout(template)
      await db.workouts.add(workout)
      navigate(`/workouts/${workout.id}`)
    } catch {
      setStartError('Не удалось начать тренировку. Попробуйте ещё раз.')
    }
  }

  const cancelActiveAndStart = async () => {
    if (!activeWorkout || !selectedTemplate) return

    try {
      const workout = createWorkout(selectedTemplate)
      await db.transaction('rw', db.workouts, async () => {
        await db.workouts.delete(activeWorkout.id)
        await db.workouts.add(workout)
      })
      navigate(`/workouts/${workout.id}`)
    } catch {
      setStartError('Не удалось начать тренировку. Попробуйте ещё раз.')
      setActiveWorkout(undefined)
      setSelectedTemplate(undefined)
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
            aria-label="Вернуться на главную"
            to="/"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
              Планирование
            </p>
            <h1 className="text-2xl font-black tracking-[-0.04em]">
              Шаблоны тренировок
            </h1>
          </div>
        </div>
        <Link
          className="grid size-11 place-items-center rounded-xl bg-[#173d2a] text-white"
          aria-label="Добавить шаблон тренировки"
          to="/workout-templates/new"
        >
          <Plus aria-hidden="true" size={22} />
        </Link>
      </header>

      <section className="mt-8" aria-live="polite">
        {loadError && (
          <p className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            Не удалось загрузить шаблоны тренировок.
          </p>
        )}
        {startError && (
          <p className="mb-4 rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            {startError}
          </p>
        )}
        {!loadError && !templates && (
          <p className="text-[#657067]">Загружаем шаблоны тренировок...</p>
        )}
        {templates?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#b7c1b2] px-6 py-14 text-center">
            <h2 className="text-xl font-black">Первый шаблон</h2>
            <p className="mt-3 text-sm leading-6 text-[#657067]">
              Соберите упражнения и количество подходов для будущей тренировки.
            </p>
            <Link
              className="mt-6 inline-block rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white"
              to="/workout-templates/new"
            >
              Добавить шаблон
            </Link>
          </div>
        )}
        {templates && templates.length > 0 && (
          <ul className="space-y-3">
            {templates.map((template) => (
              <li
                className="rounded-2xl border border-[#dce1d5] bg-white/70 p-4"
                key={template.id}
              >
                <Link
                  className="block transition hover:text-[#537441]"
                  to={`/workout-templates/${template.id}`}
                >
                  <span className="block font-bold">{template.name}</span>
                  <span className="mt-1 block text-sm text-[#657067]">
                    {template.exercises.length} упражн.,{' '}
                    {getSetsCount(template)} подходов
                  </span>
                </Link>
                <button
                  className="mt-4 w-full rounded-xl bg-[#173d2a] px-4 py-3 font-bold text-white"
                  type="button"
                  onClick={() => void startWorkout(template)}
                >
                  Начать тренировку
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {activeWorkout && selectedTemplate && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-[#152019]/45 p-5">
          <section
            className="w-full max-w-sm rounded-2xl bg-[#f5f5ef] p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="active-workout-title"
          >
            <h2 id="active-workout-title" className="text-xl font-black">
              Есть незавершённая тренировка
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#657067]">
              Сначала продолжите её или отмените, чтобы начать «
              {selectedTemplate.name}».
            </p>
            <div className="mt-6 grid gap-3">
              <button
                className="rounded-xl bg-[#173d2a] px-4 py-3 font-bold text-white"
                type="button"
                onClick={() => navigate(`/workouts/${activeWorkout.id}`)}
              >
                Продолжить тренировку
              </button>
              <button
                className="rounded-xl border border-[#b42318] px-4 py-3 font-bold text-[#b42318]"
                type="button"
                onClick={() => void cancelActiveAndStart()}
              >
                Отменить и начать новую
              </button>
              <button
                className="px-4 py-2 text-sm font-bold text-[#526056]"
                type="button"
                onClick={() => {
                  setActiveWorkout(undefined)
                  setSelectedTemplate(undefined)
                }}
              >
                Назад
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
