import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db } from '../db/database'
import type { Exercise } from '../entities/exercise'
import { ExerciseForm } from '../features/exercises/ExerciseForm'
import { ExerciseListPage } from '../features/exercises/ExerciseListPage'
import type { ExerciseInput } from '../features/exercises/exercise-form'
import { HomePage } from '../pages/HomePage'

function createExercise(values: ExerciseInput, image: Blob): Exercise {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: values.name,
    image,
    description: values.description || undefined,
    tags: values.tags,
    createdAt: now,
    updatedAt: now,
  }
}

function CreateExercisePage() {
  const navigate = useNavigate()

  return (
    <ExerciseForm
      onBack={() => navigate('/exercises')}
      onSave={async (values, image) => {
        await db.exercises.add(createExercise(values, image))
        navigate('/exercises', { replace: true })
      }}
    />
  )
}

function EditExercisePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise>()
  const [loadState, setLoadState] = useState<
    'error' | 'loading' | 'missing' | 'ready'
  >('loading')

  useEffect(() => {
    if (!id) return

    void db.exercises
      .get(id)
      .then((storedExercise) => {
        if (storedExercise) {
          setExercise(storedExercise)
          setLoadState('ready')
        } else {
          setLoadState('missing')
        }
      })
      .catch(() => setLoadState('error'))
  }, [id])

  if (loadState === 'loading') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 text-[#657067] sm:px-8">
        Загружаем упражнение...
      </main>
    )
  }

  if (loadState === 'error') {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Не удалось загрузить упражнение</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/exercises"
        >
          Вернуться к упражнениям
        </Link>
      </main>
    )
  }

  if (loadState === 'missing' || !exercise) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Упражнение не найдено</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/exercises"
        >
          Вернуться к упражнениям
        </Link>
      </main>
    )
  }

  return (
    <ExerciseForm
      exercise={exercise}
      onBack={() => navigate('/exercises')}
      onDelete={async () => {
        await db.exercises.delete(exercise.id)
        navigate('/exercises', { replace: true })
      }}
      onSave={async (values, image) => {
        await db.exercises.put({
          ...exercise,
          name: values.name,
          image,
          description: values.description || undefined,
          tags: values.tags,
          updatedAt: new Date().toISOString(),
        })
        navigate('/exercises', { replace: true })
      }}
    />
  )
}

function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
      <h1 className="text-2xl font-black">Страница не найдена</h1>
      <Link className="mt-4 inline-block font-bold text-[#173d2a]" to="/">
        На главную
      </Link>
    </main>
  )
}

function App() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  return (
    <>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercises" element={<ExerciseListPage />} />
          <Route path="/exercises/new" element={<CreateExercisePage />} />
          <Route path="/exercises/:id" element={<EditExercisePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      {needRefresh[0] && (
        <button
          className="fixed right-4 bottom-4 rounded-full bg-[#173d2a] px-5 py-3 text-sm font-semibold text-white shadow-lg"
          type="button"
          onClick={() => void updateServiceWorker(true)}
        >
          Обновить приложение
        </button>
      )}
    </>
  )
}

export default App
