import { Dumbbell, ListChecks, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/database'

type StorageStatus = 'checking' | 'ready' | 'unavailable'

const storageCopy: Record<StorageStatus, string> = {
  checking: 'Проверяем локальное хранилище...',
  ready: 'Локальное хранилище готово',
  unavailable: 'Локальное хранилище недоступно',
}

export function HomePage() {
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('checking')
  const [activeWorkoutId, setActiveWorkoutId] = useState<string>()

  useEffect(() => {
    let isMounted = true

    void db
      .open()
      .then(async () => {
        void navigator.storage?.persist?.()
        const activeWorkout = await db.workouts
          .where('status')
          .equals('active')
          .first()
        if (isMounted) {
          setActiveWorkoutId(activeWorkout?.id)
          setStorageStatus('ready')
        }
      })
      .catch(() => {
        if (isMounted) setStorageStatus('unavailable')
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-[#173d2a] text-[#d9ee8c]">
          <Dumbbell aria-hidden="true" size={21} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold tracking-tight">Replog</span>
      </header>

      <nav className="my-auto grid gap-3 py-16" aria-label="Разделы приложения">
        {activeWorkoutId && (
          <Link
            className="flex items-center gap-3 rounded-xl bg-[#6d943f] px-5 py-4 font-bold text-white"
            to={`/workouts/${activeWorkoutId}`}
          >
            <Play aria-hidden="true" size={19} fill="currentColor" />
            Продолжить тренировку
          </Link>
        )}
        <Link
          className="flex items-center gap-3 rounded-xl bg-[#173d2a] px-5 py-4 font-bold text-white"
          to="/exercises"
        >
          <Dumbbell aria-hidden="true" size={19} />
          Упражнения
        </Link>
        <Link
          className="flex items-center gap-3 rounded-xl border border-[#173d2a] bg-white px-5 py-4 font-bold text-[#173d2a]"
          to="/workout-templates"
        >
          <ListChecks aria-hidden="true" size={19} />
          Шаблоны тренировок
        </Link>
      </nav>

      <footer className="flex items-center gap-2 text-sm text-[#657067]">
        <span
          className={`size-2 rounded-full ${storageStatus === 'ready' ? 'bg-[#6d943f]' : 'bg-[#d7a13d]'}`}
          aria-hidden="true"
        />
        <span data-testid="storage-status">{storageCopy[storageStatus]}</span>
      </footer>
    </main>
  )
}
