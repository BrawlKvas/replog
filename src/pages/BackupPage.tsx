import { ArrowLeft, Download, Upload, X } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createBackup,
  createBackupFilename,
  getLastBackupAt,
  restoreBackup,
  setLastBackupAt as persistLastBackupAt,
} from '../shared/lib/backup'

type Operation = 'exporting' | 'importing' | undefined

function formatBackupDate(createdAt?: string): string {
  if (!createdAt) return 'Резервных копий ещё не создавали'

  return `Последняя копия: ${format(new Date(createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}`
}

export function BackupPage() {
  const [lastBackupAt, setLastBackupAt] = useState<string>()
  const [selectedFile, setSelectedFile] = useState<File>()
  const [operation, setOperation] = useState<Operation>()
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void getLastBackupAt()
      .then(setLastBackupAt)
      .catch(() => undefined)
  }, [])

  const handleExport = async () => {
    setOperation('exporting')
    setError(undefined)
    setSuccess(undefined)

    try {
      const { createdAt, json } = await createBackup()
      const url = URL.createObjectURL(
        new Blob([json], { type: 'application/json' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = createBackupFilename(createdAt)
      link.click()
      URL.revokeObjectURL(url)

      const createdAtIso = createdAt.toISOString()
      await persistLastBackupAt(createdAtIso)
      setLastBackupAt(createdAtIso)
      setSuccess('Резервная копия скачана.')
    } catch {
      setError('Не удалось создать резервную копию. Попробуйте ещё раз.')
    } finally {
      setOperation(undefined)
    }
  }

  const handleRestore = async () => {
    if (!selectedFile) return

    setIsRestoreDialogOpen(false)
    setOperation('importing')
    setError(undefined)
    setSuccess(undefined)

    try {
      await restoreBackup(await selectedFile.text())
      setSelectedFile(undefined)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess('Данные восстановлены из резервной копии.')
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : 'Не удалось восстановить данные.',
      )
    } finally {
      setOperation(undefined)
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <Link
          className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
          aria-label="Вернуться на главную"
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
            Данные
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            Резервная копия
          </h1>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-[#dce1d5] bg-white/70 p-5">
        <h2 className="font-bold">Сохранить данные</h2>
        <p className="mt-2 text-sm leading-6 text-[#657067]">
          Скачайте файл со всеми упражнениями, фотографиями, шаблонами и
          тренировками. Храните его в безопасном месте.
        </p>
        <p
          className="mt-4 text-sm font-semibold text-[#456236]"
          data-testid="last-backup-at"
        >
          {formatBackupDate(lastBackupAt)}
        </p>
        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-70"
          type="button"
          onClick={() => void handleExport()}
          disabled={operation !== undefined}
        >
          <Download aria-hidden="true" size={18} />
          {operation === 'exporting' ? 'Создаём копию...' : 'Скачать копию'}
        </button>
      </section>

      <section className="mt-5 rounded-2xl border border-[#dce1d5] bg-white/70 p-5">
        <h2 className="font-bold">Восстановить данные</h2>
        <p className="mt-2 text-sm leading-6 text-[#657067]">
          Импорт заменит все текущие данные на этом устройстве содержимым
          выбранной резервной копии.
        </p>
        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#173d2a] px-5 py-3 font-bold text-[#173d2a]">
          <Upload aria-hidden="true" size={18} />
          Выбрать файл копии
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0])
              setError(undefined)
              setSuccess(undefined)
            }}
            disabled={operation !== undefined}
          />
        </label>
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-[#657067]">
              {selectedFile.name}
            </span>
            <button
              className="shrink-0 font-bold text-[#b42318]"
              type="button"
              onClick={() => {
                setSelectedFile(undefined)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Убрать
            </button>
          </div>
        )}
        <button
          className="mt-4 w-full rounded-xl bg-[#6d943f] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() => setIsRestoreDialogOpen(true)}
          disabled={!selectedFile || operation !== undefined}
        >
          Восстановить из файла
        </button>
      </section>

      <div className="mt-5" aria-live="polite">
        {error && (
          <p className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-xl bg-[#e8efdf] p-4 text-sm text-[#456236]">
            {success}
          </p>
        )}
      </div>

      {isRestoreDialogOpen && selectedFile && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-[#152019]/45 p-5">
          <section
            className="w-full max-w-sm rounded-2xl bg-[#f5f5ef] p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="restore-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="restore-title" className="text-xl font-black">
                  Восстановить данные?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#657067]">
                  Все текущие упражнения, шаблоны и тренировки на этом
                  устройстве будут удалены и заменены данными из файла.
                </p>
              </div>
              <button
                className="text-[#526056]"
                type="button"
                onClick={() => setIsRestoreDialogOpen(false)}
                aria-label="Закрыть диалог"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[#cdd5c8] px-4 py-3 font-bold text-[#173d2a]"
                type="button"
                onClick={() => setIsRestoreDialogOpen(false)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl bg-[#b42318] px-4 py-3 font-bold text-white"
                type="button"
                onClick={() => void handleRestore()}
              >
                Восстановить
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
