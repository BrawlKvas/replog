import type { WorkoutTemplate } from './workout-template'

export type WorkoutSetResult = {
  weight: number | null
  repetitions: number | null
  rir: number | null
  technique: number | null
}

export type WorkoutExercise = {
  id: string
  exerciseId: string
  sets: WorkoutSetResult[]
}

export type Workout = {
  id: string
  templateId: string
  status: 'active' | 'completed'
  exercises: WorkoutExercise[]
  currentExerciseIndex: number
  currentSetIndex: number
  startedAt: string
  completedAt?: string
}

export function createEmptyWorkoutSet(): WorkoutSetResult {
  return {
    weight: null,
    repetitions: null,
    rir: null,
    technique: null,
  }
}

export function createWorkout(template: WorkoutTemplate): Workout {
  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    status: 'active',
    exercises: template.exercises.map((exercise) => ({
      id: crypto.randomUUID(),
      exerciseId: exercise.exerciseId,
      sets: Array.from({ length: exercise.sets }, createEmptyWorkoutSet),
    })),
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    startedAt: new Date().toISOString(),
  }
}

export function formatWorkoutDuration(
  startedAt: string,
  endedAt?: string,
): string {
  const elapsedMilliseconds = Math.max(
    0,
    new Date(endedAt ?? new Date().toISOString()).getTime() -
      new Date(startedAt).getTime(),
  )
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000)

  if (elapsedMinutes === 0) return 'меньше минуты'

  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60

  if (hours === 0) return `${minutes} мин`
  if (minutes === 0) return `${hours} ч`

  return `${hours} ч ${minutes} мин`
}

export function isWorkoutSetComplete(result: WorkoutSetResult): boolean {
  return (
    typeof result.weight === 'number' &&
    Number.isFinite(result.weight) &&
    typeof result.repetitions === 'number' &&
    Number.isFinite(result.repetitions) &&
    typeof result.rir === 'number' &&
    Number.isFinite(result.rir) &&
    typeof result.technique === 'number' &&
    Number.isInteger(result.technique) &&
    result.technique >= 1 &&
    result.technique <= 10
  )
}

export function getPreviousWorkoutSet(
  workouts: Workout[],
  exerciseId: string,
  setIndex: number,
): WorkoutSetResult | undefined {
  return workouts
    .filter((workout) => workout.status === 'completed' && workout.completedAt)
    .sort((first, second) =>
      (second.completedAt ?? '').localeCompare(first.completedAt ?? ''),
    )
    .map((workout) =>
      workout.exercises.find((exercise) => exercise.exerciseId === exerciseId),
    )
    .map((exercise) => exercise?.sets[setIndex])
    .find(
      (result): result is WorkoutSetResult =>
        result !== undefined && isWorkoutSetComplete(result),
    )
}
