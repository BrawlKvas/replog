export type WorkoutTemplateExercise = {
  exerciseId: string
  sets: number
}

export type WorkoutTemplate = {
  id: string
  name: string
  exercises: WorkoutTemplateExercise[]
  createdAt: string
  updatedAt: string
}
