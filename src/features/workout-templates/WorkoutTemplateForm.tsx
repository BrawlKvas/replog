import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { Exercise } from '../../entities/exercise'
import type { WorkoutTemplate } from '../../entities/workout-template'
import {
  createWorkoutTemplateFormValues,
  workoutTemplateFormSchema,
  type WorkoutTemplateInput,
  type WorkoutTemplateFormValues,
} from './workout-template-form'

type WorkoutTemplateFormProps = {
  exercises: Exercise[]
  template?: WorkoutTemplate
  onBack: () => void
  onDelete?: () => Promise<void>
  onSave: (values: WorkoutTemplateInput) => Promise<void>
}

export function WorkoutTemplateForm({
  exercises,
  template,
  onBack,
  onDelete,
  onSave,
}: WorkoutTemplateFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { control, formState, handleSubmit, register } =
    useForm<WorkoutTemplateFormValues>({
      defaultValues: createWorkoutTemplateFormValues(template),
      resolver: zodResolver(workoutTemplateFormSchema),
    })
  const { append, fields, move, remove } = useFieldArray({
    control,
    name: 'exercises',
  })
  const selectedExerciseIds = (
    useWatch({ control, name: 'exercises' }) ?? []
  ).map((exercise) => exercise.exerciseId)

  const submit = async (values: WorkoutTemplateFormValues) => {
    setIsSaving(true)
    setSubmitError('')

    try {
      await onSave(values)
    } catch {
      setSubmitError('Не удалось сохранить шаблон. Попробуйте ещё раз.')
      setIsSaving(false)
    }
  }

  const deleteTemplate = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete()
    } catch {
      setSubmitError('Не удалось удалить шаблон. Попробуйте ещё раз.')
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <button
          className="grid size-10 place-items-center rounded-xl border border-[#d8ddd1] bg-white text-[#173d2a]"
          type="button"
          onClick={onBack}
          aria-label="Вернуться к шаблонам тренировок"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
            Шаблоны тренировок
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            {template ? 'Редактирование' : 'Новый шаблон'}
          </h1>
        </div>
      </header>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(submit)}>
        <label className="block">
          <span className="text-sm font-bold">Название</span>
          <input
            className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
            {...register('name')}
            autoFocus
          />
          {formState.errors.name && (
            <p className="mt-2 text-sm text-[#b42318]">
              {formState.errors.name.message}
            </p>
          )}
        </label>

        <section>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold">Упражнения</h2>
              <p className="mt-1 text-sm text-[#657067]">
                Укажите количество подходов для каждого упражнения.
              </p>
            </div>
            <button
              className="flex shrink-0 items-center gap-2 rounded-xl border border-[#cdd5c8] bg-white px-3 py-2 text-sm font-bold text-[#173d2a] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => append({ exerciseId: '', sets: 1 })}
              disabled={exercises.length === 0}
            >
              <Plus aria-hidden="true" size={18} />
              Добавить
            </button>
          </div>

          {exercises.length === 0 && (
            <p className="mt-4 rounded-xl bg-[#e8efdf] p-4 text-sm leading-6 text-[#456236]">
              Сначала добавьте упражнения в библиотеку.{' '}
              <Link className="font-bold underline" to="/exercises/new">
                Добавить упражнение
              </Link>
            </p>
          )}

          <div className="mt-4 space-y-3">
            {fields.map((field, index) => {
              const currentExerciseId = selectedExerciseIds[index]

              return (
                <div
                  className="rounded-2xl border border-[#dce1d5] bg-white/70 p-4"
                  key={field.id}
                >
                  <div className="flex gap-3">
                    <label className="min-w-0 flex-1">
                      <span className="text-sm font-bold">Упражнение</span>
                      <select
                        className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-3 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
                        {...register(`exercises.${index}.exerciseId`)}
                      >
                        <option value="">Выберите упражнение</option>
                        {exercises
                          .filter(
                            (exercise) =>
                              exercise.id === currentExerciseId ||
                              !selectedExerciseIds.includes(exercise.id),
                          )
                          .map((exercise) => (
                            <option value={exercise.id} key={exercise.id}>
                              {exercise.name}
                            </option>
                          ))}
                      </select>
                      {formState.errors.exercises?.[index]?.exerciseId && (
                        <p className="mt-2 text-sm text-[#b42318]">
                          {
                            formState.errors.exercises[index]?.exerciseId
                              ?.message
                          }
                        </p>
                      )}
                    </label>
                    <label className="w-28 shrink-0">
                      <span className="text-sm font-bold">Подходы</span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-3 py-3 text-center outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        {...register(`exercises.${index}.sets`)}
                      />
                      {formState.errors.exercises?.[index]?.sets && (
                        <p className="mt-2 text-sm text-[#b42318]">
                          {formState.errors.exercises[index]?.sets?.message}
                        </p>
                      )}
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <button
                      className="grid size-10 place-items-center rounded-xl text-[#173d2a] disabled:opacity-35"
                      type="button"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label="Переместить выше"
                    >
                      <ChevronUp aria-hidden="true" size={20} />
                    </button>
                    <button
                      className="grid size-10 place-items-center rounded-xl text-[#173d2a] disabled:opacity-35"
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={index === fields.length - 1}
                      aria-label="Переместить ниже"
                    >
                      <ChevronDown aria-hidden="true" size={20} />
                    </button>
                    <button
                      className="grid size-10 place-items-center rounded-xl text-[#b42318]"
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Удалить позицию из шаблона"
                    >
                      <Trash2 aria-hidden="true" size={19} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {formState.errors.exercises?.message && (
            <p className="mt-2 text-sm text-[#b42318]">
              {formState.errors.exercises.message}
            </p>
          )}
        </section>

        {submitError && <p className="text-sm text-[#b42318]">{submitError}</p>}

        <button
          className="w-full rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Сохраняем...' : 'Сохранить шаблон'}
        </button>

        {onDelete && (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-[#b42318]"
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 aria-hidden="true" size={18} />
            Удалить шаблон
          </button>
        )}
      </form>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-[#152019]/45 p-5">
          <section
            className="w-full max-w-sm rounded-2xl bg-[#f5f5ef] p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-title" className="text-xl font-black">
                  Удалить шаблон?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#657067]">
                  Шаблон будет удалён только с этого устройства.
                </p>
              </div>
              <button
                className="text-[#526056]"
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                aria-label="Закрыть диалог"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 font-bold"
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl bg-[#b42318] px-4 py-3 font-bold text-white disabled:opacity-70"
                type="button"
                onClick={() => void deleteTemplate()}
                disabled={isDeleting}
              >
                {isDeleting ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
