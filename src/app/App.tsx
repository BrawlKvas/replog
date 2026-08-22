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
import type { WorkoutTemplate } from '../entities/workout-template'
import { ExerciseForm } from '../features/exercises/ExerciseForm'
import { ExerciseListPage } from '../features/exercises/ExerciseListPage'
import type { ExerciseInput } from '../features/exercises/exercise-form'
import { WorkoutEditorPage } from '../features/workouts/WorkoutEditorPage'
import { WorkoutPage } from '../features/workouts/WorkoutPage'
import { WorkoutSummaryPage } from '../features/workouts/WorkoutSummaryPage'
import { WorkoutTemplateDetailPage } from '../features/workout-templates/WorkoutTemplateDetailPage'
import { WorkoutTemplateForm } from '../features/workout-templates/WorkoutTemplateForm'
import { WorkoutTemplateListPage } from '../features/workout-templates/WorkoutTemplateListPage'
import type { WorkoutTemplateInput } from '../features/workout-templates/workout-template-form'
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

function createWorkoutTemplate(values: WorkoutTemplateInput): WorkoutTemplate {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: values.name,
    exercises: values.exercises,
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
        const templateUsingExercise = await db.workoutTemplates
          .filter((template) =>
            template.exercises.some(
              (templateExercise) => templateExercise.exerciseId === exercise.id,
            ),
          )
          .first()

        if (templateUsingExercise) {
          throw new Error(
            'Упражнение используется в шаблонах тренировок. Сначала удалите его из шаблонов.',
          )
        }

        const activeWorkoutUsingExercise = await db.workouts
          .where('status')
          .equals('active')
          .filter((workout) =>
            workout.exercises.some(
              (workoutExercise) => workoutExercise.exerciseId === exercise.id,
            ),
          )
          .first()

        if (activeWorkoutUsingExercise) {
          throw new Error(
            'Упражнение используется в текущей тренировке. Сначала отмените тренировку или замените упражнение.',
          )
        }

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

function CreateWorkoutTemplatePage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<Exercise[]>()
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    void db.exercises
      .orderBy('name')
      .toArray()
      .then(setExercises)
      .catch(() => setLoadError(true))
  }, [])

  if (loadError) {
    return <TemplateLoadError />
  }

  if (!exercises) {
    return <TemplateLoading />
  }

  return (
    <WorkoutTemplateForm
      exercises={exercises}
      onBack={() => navigate('/workout-templates')}
      onSave={async (values) => {
        await db.workoutTemplates.add(createWorkoutTemplate(values))
        navigate('/workout-templates', { replace: true })
      }}
    />
  )
}

function EditWorkoutTemplatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<WorkoutTemplate>()
  const [exercises, setExercises] = useState<Exercise[]>()
  const [loadState, setLoadState] = useState<
    'error' | 'loading' | 'missing' | 'ready'
  >('loading')

  useEffect(() => {
    if (!id) return

    void Promise.all([
      db.workoutTemplates.get(id),
      db.exercises.orderBy('name').toArray(),
    ])
      .then(([storedTemplate, storedExercises]) => {
        if (!storedTemplate) {
          setLoadState('missing')
          return
        }

        setTemplate(storedTemplate)
        setExercises(storedExercises)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [id])

  if (loadState === 'loading') {
    return <TemplateLoading />
  }

  if (loadState === 'error') {
    return <TemplateLoadError />
  }

  if (loadState === 'missing' || !template || !exercises) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
        <h1 className="text-2xl font-black">Шаблон тренировки не найден</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#173d2a]"
          to="/workout-templates"
        >
          Вернуться к шаблонам тренировок
        </Link>
      </main>
    )
  }

  return (
    <WorkoutTemplateForm
      exercises={exercises}
      template={template}
      onBack={() => navigate(`/workout-templates/${template.id}`)}
      onDelete={async () => {
        await db.workoutTemplates.delete(template.id)
        navigate('/workout-templates', { replace: true })
      }}
      onSave={async (values) => {
        await db.workoutTemplates.put({
          ...template,
          name: values.name,
          exercises: values.exercises,
          updatedAt: new Date().toISOString(),
        })
        navigate(`/workout-templates/${template.id}`, { replace: true })
      }}
    />
  )
}

function TemplateLoading() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6 text-[#657067] sm:px-8">
      Загружаем шаблон тренировки...
    </main>
  )
}

function TemplateLoadError() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-6 sm:px-8">
      <h1 className="text-2xl font-black">Не удалось загрузить шаблон</h1>
      <Link
        className="mt-4 inline-block font-bold text-[#173d2a]"
        to="/workout-templates"
      >
        Вернуться к шаблонам тренировок
      </Link>
    </main>
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
          <Route
            path="/workout-templates"
            element={<WorkoutTemplateListPage />}
          />
          <Route
            path="/workout-templates/new"
            element={<CreateWorkoutTemplatePage />}
          />
          <Route
            path="/workout-templates/:id/edit"
            element={<EditWorkoutTemplatePage />}
          />
          <Route
            path="/workout-templates/:id"
            element={<WorkoutTemplateDetailPage />}
          />
          <Route path="/workouts/:id" element={<WorkoutPage />} />
          <Route path="/workouts/:id/edit" element={<WorkoutEditorPage />} />
          <Route
            path="/workouts/:id/summary"
            element={<WorkoutSummaryPage />}
          />
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
