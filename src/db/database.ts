import Dexie, { type EntityTable } from 'dexie'
import type { BodyWeightEntry } from '../entities/body-weight'
import type { Exercise } from '../entities/exercise'
import type { Workout } from '../entities/workout'
import type { WorkoutTemplate } from '../entities/workout-template'

export type AppMetadata = {
  id: string
  value: string
}

class ReplogDatabase extends Dexie {
  metadata!: EntityTable<AppMetadata, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workoutTemplates!: EntityTable<WorkoutTemplate, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  bodyWeights!: EntityTable<BodyWeightEntry, 'date'>

  constructor() {
    super('replog')

    this.version(1).stores({
      metadata: 'id',
    })

    this.version(2).stores({
      metadata: 'id',
      exercises: 'id, name, createdAt, *tags',
    })

    this.version(3).stores({
      metadata: 'id',
      exercises: 'id, name, createdAt, *tags',
      workoutTemplates: 'id, name, createdAt',
    })

    this.version(4).stores({
      metadata: 'id',
      exercises: 'id, name, createdAt, *tags',
      workoutTemplates: 'id, name, createdAt',
      workouts: 'id, status, startedAt, completedAt, templateId',
    })

    this.version(5).stores({
      metadata: 'id',
      exercises: 'id, name, createdAt, *tags',
      workoutTemplates: 'id, name, createdAt',
      workouts: 'id, status, startedAt, completedAt, templateId',
      bodyWeights: 'date',
    })
  }
}

export const db = new ReplogDatabase()
