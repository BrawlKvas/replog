import Dexie, { type EntityTable } from 'dexie'

export type AppMetadata = {
  id: string
  value: string
}

class ReplogDatabase extends Dexie {
  metadata!: EntityTable<AppMetadata, 'id'>

  constructor() {
    super('replog')

    this.version(1).stores({
      metadata: 'id',
    })
  }
}

export const db = new ReplogDatabase()
