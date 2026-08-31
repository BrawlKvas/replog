import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Scale, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { db } from '../../db/database'
import type { BodyWeightEntry } from '../../entities/body-weight'
import { getBodyWeightAnalytics } from './body-weight-analytics'
import {
  createBodyWeightFormSchema,
  createBodyWeightFormValues,
  type BodyWeightFormValues,
} from './body-weight-form'

type LoadState = 'error' | 'loading' | 'ready'

function formatWeight(weight: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(weight)
}

function formatEntryDate(date: string) {
  return format(new Date(`${date}T12:00:00`), 'd MMMM yyyy', { locale: ru })
}

export function BodyWeightPage() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>()
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [editingEntry, setEditingEntry] = useState<BodyWeightEntry>()
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [deletingDate, setDeletingDate] = useState<string>()
  const [entryToDelete, setEntryToDelete] = useState<BodyWeightEntry>()
  const schema = createBodyWeightFormSchema()
  const { formState, handleSubmit, register, reset } =
    useForm<BodyWeightFormValues>({
      defaultValues: createBodyWeightFormValues(),
      resolver: zodResolver(schema),
    })

  useEffect(() => {
    let isMounted = true

    void db.bodyWeights
      .toArray()
      .then((storedEntries) => {
        if (!isMounted) return
        setEntries(
          storedEntries.sort((first, second) =>
            second.date.localeCompare(first.date),
          ),
        )
        setLoadState('ready')
      })
      .catch(() => {
        if (isMounted) setLoadState('error')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const saveEntry = async (values: BodyWeightFormValues) => {
    setIsSaving(true)
    setSubmitError('')
    const now = new Date().toISOString()
    const existingEntry = entries?.find((entry) => entry.date === values.date)

    try {
      await db.transaction('rw', db.bodyWeights, async () => {
        if (editingEntry && editingEntry.date !== values.date) {
          await db.bodyWeights.delete(editingEntry.date)
        }
        await db.bodyWeights.put({
          date: values.date,
          weight: values.weight,
          createdAt: editingEntry?.createdAt ?? existingEntry?.createdAt ?? now,
          updatedAt: now,
        })
      })
      const updatedEntries = await db.bodyWeights.toArray()
      setEntries(
        updatedEntries.sort((first, second) =>
          second.date.localeCompare(first.date),
        ),
      )
      setEditingEntry(undefined)
      reset(createBodyWeightFormValues())
    } catch {
      setSubmitError('Не удалось сохранить вес. Попробуйте ещё раз.')
    } finally {
      setIsSaving(false)
    }
  }

  const editEntry = (entry: BodyWeightEntry) => {
    setEditingEntry(entry)
    setSubmitError('')
    reset(createBodyWeightFormValues(entry))
  }

  const cancelEditing = () => {
    setEditingEntry(undefined)
    reset(createBodyWeightFormValues())
  }

  const deleteEntry = async (entry: BodyWeightEntry) => {
    setDeletingDate(entry.date)
    setSubmitError('')

    try {
      await db.bodyWeights.delete(entry.date)
      setEntries((currentEntries) =>
        currentEntries?.filter(({ date }) => date !== entry.date),
      )
      if (editingEntry?.date === entry.date) cancelEditing()
    } catch {
      setSubmitError('Не удалось удалить запись. Попробуйте ещё раз.')
    } finally {
      setDeletingDate(undefined)
      setEntryToDelete(undefined)
    }
  }

  const analytics = entries ? getBodyWeightAnalytics(entries) : undefined

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
            Дневник
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">Вес тела</h1>
        </div>
      </header>

      <form
        className="mt-8 rounded-2xl border border-[#dce1d5] bg-white/70 p-4 sm:p-5"
        onSubmit={handleSubmit(saveEntry)}
      >
        <h2 className="font-bold">
          {editingEntry
            ? `Изменить запись за ${formatEntryDate(editingEntry.date)}`
            : 'Новое измерение'}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">Дата</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              type="date"
              {...register('date')}
            />
            {formState.errors.date && (
              <p className="mt-2 text-sm text-[#b42318]">
                {formState.errors.date.message}
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-bold">Вес, кг</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              type="number"
              {...register('weight', { valueAsNumber: true })}
            />
            {formState.errors.weight && (
              <p className="mt-2 text-sm text-[#b42318]">
                {formState.errors.weight.message}
              </p>
            )}
          </label>
        </div>
        {submitError && (
          <p className="mt-4 text-sm text-[#b42318]">{submitError}</p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            className="flex-1 rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={isSaving}
          >
            {isSaving
              ? 'Сохраняем...'
              : editingEntry
                ? 'Сохранить изменения'
                : 'Сохранить вес'}
          </button>
          {editingEntry && (
            <button
              className="rounded-xl border border-[#cdd5c8] bg-white px-5 py-3 font-bold"
              type="button"
              onClick={cancelEditing}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <section className="mt-8" aria-live="polite">
        {loadState === 'loading' && (
          <p className="text-[#657067]">Загружаем записи веса...</p>
        )}
        {loadState === 'error' && (
          <p className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b42318]">
            Не удалось загрузить записи веса.
          </p>
        )}
        {loadState === 'ready' && analytics && (
          <div className="space-y-6">
            {analytics.latest ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric
                    label="Текущий"
                    value={`${formatWeight(analytics.latest.weight)} кг`}
                  />
                  <Metric
                    label="Изменение"
                    value={
                      analytics.change === undefined
                        ? 'Нет данных'
                        : `${analytics.change > 0 ? '+' : ''}${formatWeight(analytics.change)} кг`
                    }
                  />
                  <Metric
                    label="Минимум"
                    value={
                      analytics.minimum === undefined
                        ? 'Нет данных'
                        : `${formatWeight(analytics.minimum)} кг`
                    }
                  />
                  <Metric
                    label="Максимум"
                    value={
                      analytics.maximum === undefined
                        ? 'Нет данных'
                        : `${formatWeight(analytics.maximum)} кг`
                    }
                  />
                </div>
                <section className="rounded-2xl border border-[#dce1d5] bg-white/70 p-4 sm:p-5">
                  <h2 className="font-bold">Динамика веса</h2>
                  <p className="mt-1 text-sm text-[#657067]">
                    Последние 30 дней
                  </p>
                  {analytics.recentEntries.length > 0 ? (
                    <div className="mt-5 h-60" data-testid="body-weight-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.recentEntries}
                          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                        >
                          <XAxis
                            axisLine={false}
                            dataKey="date"
                            tick={{ fill: '#657067', fontSize: 11 }}
                            tickFormatter={(date) =>
                              formatEntryDate(date).replace(/ \d{4}$/, '')
                            }
                            tickLine={false}
                          />
                          <YAxis
                            axisLine={false}
                            domain={['dataMin - 1', 'dataMax + 1']}
                            tick={{ fill: '#657067', fontSize: 11 }}
                            tickLine={false}
                            width={38}
                          />
                          <Tooltip
                            formatter={(value) => [
                              `${formatWeight(Number(value))} кг`,
                              'Вес',
                            ]}
                            labelFormatter={(date) =>
                              formatEntryDate(String(date))
                            }
                          />
                          <Line
                            dataKey="weight"
                            dot={{ fill: '#173d2a', r: 4 }}
                            stroke="#537441"
                            strokeWidth={3}
                            type="monotone"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-[#657067]">
                      За последние 30 дней измерений не было.
                    </p>
                  )}
                </section>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#b7c1b2] px-6 py-14 text-center">
                <Scale
                  className="mx-auto text-[#537441]"
                  aria-hidden="true"
                  size={28}
                />
                <h2 className="mt-4 text-xl font-black">Записей пока нет</h2>
                <p className="mt-3 text-sm leading-6 text-[#657067]">
                  Добавьте первое измерение, чтобы увидеть динамику.
                </p>
              </div>
            )}
            {entries && entries.length > 0 && (
              <section>
                <h2 className="font-bold">История</h2>
                <ul className="mt-3 space-y-3">
                  {entries.map((entry) => (
                    <li
                      key={entry.date}
                      className="flex items-center gap-3 rounded-2xl border border-[#dce1d5] bg-white/70 p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">
                          {formatWeight(entry.weight)} кг
                        </p>
                        <p className="mt-1 text-sm text-[#657067]">
                          {formatEntryDate(entry.date)}
                        </p>
                      </div>
                      <button
                        className="rounded-xl px-3 py-2 text-sm font-bold text-[#173d2a]"
                        type="button"
                        onClick={() => editEntry(entry)}
                      >
                        Изменить
                      </button>
                      <button
                        className="rounded-xl p-2 text-[#b42318] disabled:opacity-70"
                        type="button"
                        aria-label={`Удалить запись за ${formatEntryDate(entry.date)}`}
                        disabled={deletingDate === entry.date}
                        onClick={() => setEntryToDelete(entry)}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </section>
      {entryToDelete && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-[#152019]/45 p-5">
          <section
            className="w-full max-w-sm rounded-2xl bg-[#f5f5ef] p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-weight-title"
          >
            <h2 id="delete-weight-title" className="text-xl font-black">
              Удалить запись?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#657067]">
              Вес за {formatEntryDate(entryToDelete.date)} будет удалён с этого
              устройства.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 font-bold"
                type="button"
                onClick={() => setEntryToDelete(undefined)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl bg-[#b42318] px-4 py-3 font-bold text-white disabled:opacity-70"
                type="button"
                disabled={deletingDate === entryToDelete.date}
                onClick={() => void deleteEntry(entryToDelete)}
              >
                {deletingDate === entryToDelete.date ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#e8efdf] p-3">
      <dt className="text-xs font-semibold text-[#537441]">{label}</dt>
      <dd className="mt-2 text-sm font-black tracking-[-0.03em]">{value}</dd>
    </div>
  )
}
