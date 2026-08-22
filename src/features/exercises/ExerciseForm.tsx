import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ImagePlus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Exercise } from '../../entities/exercise'
import { compressImage } from './image-processing'
import {
  createExerciseFormValues,
  exerciseFormSchema,
  normalizeTags,
  type ExerciseInput,
  type ExerciseFormValues,
} from './exercise-form'

type ExerciseFormProps = {
  exercise?: Exercise
  onBack: () => void
  onDelete?: () => Promise<void>
  onSave: (values: ExerciseInput, image: Blob) => Promise<void>
}

function ImagePreview({ image }: { image: Blob }) {
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(image)

    if (imageRef.current) imageRef.current.src = url

    return () => URL.revokeObjectURL(url)
  }, [image])

  return (
    <img
      ref={imageRef}
      className="aspect-[4/3] w-full object-cover"
      alt="Предпросмотр упражнения"
    />
  )
}

export function ExerciseForm({
  exercise,
  onBack,
  onDelete,
  onSave,
}: ExerciseFormProps) {
  const [image, setImage] = useState<Blob | undefined>(exercise?.image)
  const [imageError, setImageError] = useState('')
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const imageRequestRef = useRef(0)
  const { formState, handleSubmit, register } = useForm<ExerciseFormValues>({
    defaultValues: createExerciseFormValues(exercise),
    resolver: zodResolver(exerciseFormSchema),
  })

  const handleImageChange = async (file?: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageError('Выберите файл изображения')
      return
    }

    const requestId = ++imageRequestRef.current
    setImageError('')
    setIsProcessingImage(true)

    try {
      const compressedImage = await compressImage(file)

      if (requestId === imageRequestRef.current) setImage(compressedImage)
    } catch {
      if (requestId === imageRequestRef.current) {
        setImageError('Не удалось обработать это изображение')
      }
    } finally {
      if (requestId === imageRequestRef.current) setIsProcessingImage(false)
    }
  }

  const submit = async (values: ExerciseFormValues) => {
    if (!image) {
      setImageError('Добавьте фотографию упражнения')
      return
    }

    setIsSaving(true)
    setSubmitError('')

    try {
      await onSave({ ...values, tags: normalizeTags(values.tags) }, image)
    } catch {
      setSubmitError('Не удалось сохранить упражнение. Попробуйте ещё раз.')
      setIsSaving(false)
    }
  }

  const deleteExercise = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось удалить упражнение. Попробуйте ещё раз.',
      )
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
          aria-label="Вернуться к упражнениям"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[#537441] uppercase">
            Упражнения
          </p>
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            {exercise ? 'Редактирование' : 'Новое упражнение'}
          </h1>
        </div>
      </header>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(submit)}>
        <div>
          <span className="text-sm font-bold">Фотография</span>
          <label className="mt-2 block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-[#9ead99] bg-white/60">
            {image ? (
              <ImagePreview image={image} />
            ) : (
              <span className="flex aspect-[4/3] flex-col items-center justify-center gap-3 px-5 text-center text-sm text-[#657067]">
                <ImagePlus
                  className="text-[#537441]"
                  aria-hidden="true"
                  size={28}
                />
                Добавьте фотографию упражнения
              </span>
            )}
            <span className="block border-t border-[#dce1d5] px-4 py-3 text-center text-sm font-semibold text-[#173d2a]">
              {image ? 'Заменить фотографию' : 'Выбрать фотографию'}
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) =>
                void handleImageChange(event.target.files?.[0])
              }
              disabled={isProcessingImage}
            />
          </label>
          {imageError && (
            <p className="mt-2 text-sm text-[#b42318]">{imageError}</p>
          )}
          {isProcessingImage && (
            <p className="mt-2 text-sm text-[#657067]">
              Обрабатываем фотографию...
            </p>
          )}
        </div>

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

        <label className="block">
          <span className="text-sm font-bold">
            Описание{' '}
            <span className="font-normal text-[#657067]">(необязательно)</span>
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
            {...register('description')}
          />
          {formState.errors.description && (
            <p className="mt-2 text-sm text-[#b42318]">
              {formState.errors.description.message}
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-bold">
            Теги{' '}
            <span className="font-normal text-[#657067]">(необязательно)</span>
          </span>
          <input
            className="mt-2 w-full rounded-xl border border-[#cdd5c8] bg-white px-4 py-3 outline-none focus:border-[#537441] focus:ring-2 focus:ring-[#d9ee8c]"
            placeholder="Например: ноги, сила"
            {...register('tags')}
          />
          <span className="mt-2 block text-sm text-[#657067]">
            Разделяйте теги запятыми
          </span>
        </label>

        {submitError && <p className="text-sm text-[#b42318]">{submitError}</p>}

        <button
          className="w-full rounded-xl bg-[#173d2a] px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={isSaving || isProcessingImage}
        >
          {isProcessingImage
            ? 'Обрабатываем фотографию...'
            : isSaving
              ? 'Сохраняем...'
              : 'Сохранить упражнение'}
        </button>

        {onDelete && (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-[#b42318]"
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 aria-hidden="true" size={18} />
            Удалить упражнение
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
                  Удалить упражнение?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#657067]">
                  Фотография и данные упражнения будут удалены с этого
                  устройства.
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
                onClick={() => void deleteExercise()}
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
