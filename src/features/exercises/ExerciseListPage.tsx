import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/database'
import type { Exercise } from '../../entities/exercise'

function ExerciseImage({ exercise }: { exercise: Exercise }) {
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(exercise.image)

    if (imageRef.current) imageRef.current.src = url

    return () => URL.revokeObjectURL(url)
  }, [exercise.image])

  return (
    <img
      ref={imageRef}
      className="size-20 shrink-0 rounded-xl object-cover"
      alt=""
    />
  )
}

export function ExerciseListPage() {
  const [exercises, setExercises] = useState<Exercise[]>()
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    void db.exercises
      .orderBy('name')
      .toArray()
      .then(setExercises)
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
              Библиотека
            </p>
            <h1 className="text-2xl font-black tracking-[-0.04em]">
              Упражнения
            </h1>
          </div>
        </div>
        <Link
          className="grid size-11 place-items-center rounded-xl bg-[#173d2a] text-white"
          aria-label="Добавить упражнение"
          to="/exercises/new"
        >
          <Plus aria-hidden="true" size={22} />
        </Link>
      </header>

      <section className="mt-8" aria-live="polite">
        {loadError && (
          <p className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            Не удалось загрузить упражнения.
          </p>
        )}
        {!loadError && !exercises && (
          <p className="text-[#657067]">Загружаем упражнения...</p>
        )}
        {exercises?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#b7c1b2] px-6 py-14 text-center">
            <h2 className="text-xl font-black">Первое упражнение</h2>
            <p className="mt-3 text-sm leading-6 text-[#657067]">
              Добавьте упражнение с фотографией, чтобы собрать свою библиотеку.
            </p>
            <Link
              className="mt-6 rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white"
              to="/exercises/new"
            >
              Добавить упражнение
            </Link>
          </div>
        )}
        {exercises && exercises.length > 0 && (
          <ul className="space-y-3">
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                <Link
                  className="flex w-full items-center gap-4 rounded-2xl border border-[#dce1d5] bg-white/70 p-3 text-left transition hover:border-[#9ead99]"
                  to={`/exercises/${exercise.id}`}
                >
                  <ExerciseImage exercise={exercise} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {exercise.name}
                    </span>
                    {exercise.description && (
                      <span className="mt-1 line-clamp-2 block text-sm leading-5 text-[#657067]">
                        {exercise.description}
                      </span>
                    )}
                    {exercise.tags.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {exercise.tags.map((tag) => (
                          <span
                            className="rounded-full bg-[#e8efdf] px-2 py-0.5 text-xs font-semibold text-[#456236]"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
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
