import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/database'
import type { WorkoutTemplate } from '../../entities/workout-template'

function getSetsCount(template: WorkoutTemplate) {
  return template.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  )
}

export function WorkoutTemplateListPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>()
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    void db.workoutTemplates
      .orderBy('name')
      .toArray()
      .then(setTemplates)
      .catch(() => setLoadError(true))
  }, [])

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
              <li key={template.id}>
                <Link
                  className="block rounded-2xl border border-[#dce1d5] bg-white/70 p-4 transition hover:border-[#9ead99]"
                  to={`/workout-templates/${template.id}`}
                >
                  <span className="block font-bold">{template.name}</span>
                  <span className="mt-1 block text-sm text-[#657067]">
                    {template.exercises.length} упражн.,{' '}
                    {getSetsCount(template)} подходов
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
