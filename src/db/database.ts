import Dexie, { type EntityTable } from 'dexie'
import type { Exercise } from '../entities/exercise'

export type AppMetadata = {
  id: string
  value: string
}

class ReplogDatabase extends Dexie {
  metadata!: EntityTable<AppMetadata, 'id'>
  exercises!: EntityTable<Exercise, 'id'>

  constructor() {
    super('replog')

    this.version(1).stores({
      metadata: 'id',
    })

    this.version(2).stores({
      metadata: 'id',
      exercises: 'id, name, createdAt, *tags',
    })
  }
}

export const db = new ReplogDatabase()
