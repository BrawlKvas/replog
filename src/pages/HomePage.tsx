import { Archive, Dumbbell, History, ListChecks, Play } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import { getLastBackupAt } from '../shared/lib/backup'

type StorageStatus = 'checking' | 'ready' | 'unavailable'

const storageCopy: Record<StorageStatus, string> = {
  checking: 'Проверяем локальное хранилище...',
  ready: 'Локальное хранилище готово',
  unavailable: 'Локальное хранилище недоступно',
}

export function HomePage() {
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('checking')
  const [activeWorkoutId, setActiveWorkoutId] = useState<string>()
  const [lastBackupAt, setLastBackupAt] = useState<string>()

  useEffect(() => {
    let isMounted = true

    void db
      .open()
      .then(async () => {
        void navigator.storage?.persist?.()
        const [activeWorkout, storedLastBackupAt] = await Promise.all([
          db.workouts.where('status').equals('active').first(),
          getLastBackupAt(),
        ])
        if (isMounted) {
          setActiveWorkoutId(activeWorkout?.id)
          setLastBackupAt(storedLastBackupAt)
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
          className="flex items-center gap-3 rounded-xl border border-[#173d2a] bg-white px-5 py-4 font-bold text-[#173d2a]"
          to="/workouts/history"
        >
          <History aria-hidden="true" size={19} />
          История тренировок
        </Link>
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
        <Link
          className="flex items-center gap-3 rounded-xl border border-[#173d2a] bg-white px-5 py-4 font-bold text-[#173d2a]"
          to="/backup"
        >
          <Archive aria-hidden="true" size={19} />
          Резервная копия
        </Link>
      </nav>

      <footer className="space-y-2 text-sm text-[#657067]">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${storageStatus === 'ready' ? 'bg-[#6d943f]' : 'bg-[#d7a13d]'}`}
            aria-hidden="true"
          />
          <span data-testid="storage-status">{storageCopy[storageStatus]}</span>
        </div>
        <p data-testid="home-last-backup-at">
          {lastBackupAt
            ? `Последняя копия: ${format(new Date(lastBackupAt), 'd MMMM yyyy, HH:mm', { locale: ru })}`
            : 'Резервных копий ещё не создавали'}
        </p>
      </footer>
    </main>
  )
}
