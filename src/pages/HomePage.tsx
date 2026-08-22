import { Database, Dumbbell, Download } from 'lucide-react'
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

  useEffect(() => {
    let isMounted = true

    void db
      .open()
      .then(() => {
        void navigator.storage?.persist?.()
        if (isMounted) setStorageStatus('ready')
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
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#173d2a] text-[#d9ee8c]">
            <Dumbbell aria-hidden="true" size={21} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">Replog</span>
        </div>
        <span className="rounded-full border border-[#d8ddd1] px-3 py-1 text-xs font-medium text-[#526056]">
          Лично
        </span>
      </header>

      <section className="my-auto py-16">
        <p className="mb-4 text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
          Дневник тренировок
        </p>
        <h1 className="max-w-md text-4xl leading-[1.04] font-black tracking-[-0.05em] text-[#152019] sm:text-6xl">
          Тренировки остаются твоими.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-[#5b675d] sm:text-lg">
          Replog работает без аккаунта и интернета. Все записи хранятся только
          на этом устройстве.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-[#dce1d5] bg-white/60 p-5">
            <Database className="text-[#537441]" aria-hidden="true" size={21} />
            <h2 className="mt-5 font-bold">На устройстве</h2>
            <p className="mt-1 text-sm leading-6 text-[#657067]">
              Источник данных — IndexedDB в браузере.
            </p>
          </article>
          <article className="rounded-2xl border border-[#dce1d5] bg-white/60 p-5">
            <Download className="text-[#537441]" aria-hidden="true" size={21} />
            <h2 className="mt-5 font-bold">Под твоим контролем</h2>
            <p className="mt-1 text-sm leading-6 text-[#657067]">
              Резервные копии будут выгружаться в JSON-файл.
            </p>
          </article>
        </div>

        <Link
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d2a] px-5 py-4 font-bold text-white sm:w-auto"
          to="/exercises"
        >
          <Dumbbell aria-hidden="true" size={19} />
          Открыть упражнения
        </Link>
      </section>

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
