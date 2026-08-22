import { format } from 'date-fns'
import { z } from 'zod'
import { db } from '../../db/database'
import type { Exercise } from '../../entities/exercise'
import type { Workout } from '../../entities/workout'
import type { WorkoutTemplate } from '../../entities/workout-template'

const BACKUP_FORMAT_VERSION = 1
const LAST_BACKUP_AT_METADATA_ID = 'last-backup-at'

const timestampSchema = z.string().datetime()
const identifierSchema = z.string().min(1)

const backupExerciseSchema = z.object({
  id: identifierSchema,
  name: z.string().min(1),
  image: z.object({
    base64: z.string(),
    type: z.string().min(1),
  }),
  description: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const workoutSetResultSchema = z.object({
  weight: z.number().finite().nullable(),
  repetitions: z.number().finite().nullable(),
  rir: z.number().finite().nullable(),
  technique: z.number().finite().nullable(),
})

const backupSchema = z.object({
  format: z.literal('replog-backup'),
  version: z.literal(BACKUP_FORMAT_VERSION),
  createdAt: timestampSchema,
  exercises: z.array(backupExerciseSchema),
  workoutTemplates: z.array(
    z.object({
      id: identifierSchema,
      name: z.string().min(1),
      exercises: z.array(
        z.object({
          exerciseId: identifierSchema,
          sets: z.number().int().positive(),
        }),
      ),
      createdAt: timestampSchema,
      updatedAt: timestampSchema,
    }),
  ),
  workouts: z.array(
    z
      .object({
        id: identifierSchema,
        templateId: identifierSchema,
        status: z.enum(['active', 'completed']),
        exercises: z.array(
          z.object({
            id: identifierSchema,
            exerciseId: identifierSchema,
            sets: z.array(workoutSetResultSchema),
          }),
        ),
        currentExerciseIndex: z.number().int().nonnegative(),
        currentSetIndex: z.number().int().nonnegative(),
        startedAt: timestampSchema,
        completedAt: timestampSchema.optional(),
      })
      .refine(
        (workout) =>
          workout.status === 'active' || workout.completedAt !== undefined,
        'Completed workouts must have a completion date',
      ),
  ),
})

type BackupFile = z.infer<typeof backupSchema>

export type BackupSnapshot = {
  createdAt: string
  exercises: Exercise[]
  workoutTemplates: WorkoutTemplate[]
  workouts: Workout[]
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return bytes
  } catch {
    throw new Error('Файл резервной копии содержит повреждённое изображение.')
  }
}

function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return new Blob([buffer], { type })
}

async function serializeExercise(exercise: Exercise) {
  return {
    ...exercise,
    image: {
      base64: bytesToBase64(new Uint8Array(await exercise.image.arrayBuffer())),
      type: exercise.image.type || 'application/octet-stream',
    },
  }
}

async function deserializeExercise(
  exercise: BackupFile['exercises'][number],
): Promise<Exercise> {
  return {
    ...exercise,
    image: bytesToBlob(
      base64ToBytes(exercise.image.base64),
      exercise.image.type,
    ),
  }
}

export async function serializeBackup(
  snapshot: BackupSnapshot,
): Promise<string> {
  const backup: BackupFile = {
    format: 'replog-backup',
    version: BACKUP_FORMAT_VERSION,
    createdAt: snapshot.createdAt,
    exercises: await Promise.all(snapshot.exercises.map(serializeExercise)),
    workoutTemplates: snapshot.workoutTemplates,
    workouts: snapshot.workouts,
  }

  return JSON.stringify(backup)
}

export async function parseBackup(json: string): Promise<BackupSnapshot> {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Не удалось прочитать файл резервной копии.')
  }

  const validation = backupSchema.safeParse(parsed)

  if (!validation.success) {
    throw new Error('Файл резервной копии имеет неподдерживаемый формат.')
  }

  return {
    createdAt: validation.data.createdAt,
    exercises: await Promise.all(
      validation.data.exercises.map(deserializeExercise),
    ),
    workoutTemplates: validation.data.workoutTemplates,
    workouts: validation.data.workouts,
  }
}

export async function createBackup(): Promise<{
  createdAt: Date
  json: string
}> {
  const createdAt = new Date()
  const [exercises, workoutTemplates, workouts] = await Promise.all([
    db.exercises.toArray(),
    db.workoutTemplates.toArray(),
    db.workouts.toArray(),
  ])

  return {
    createdAt,
    json: await serializeBackup({
      createdAt: createdAt.toISOString(),
      exercises,
      workoutTemplates,
      workouts,
    }),
  }
}

export async function restoreBackup(json: string): Promise<void> {
  const backup = await parseBackup(json)

  await db.transaction(
    'rw',
    db.exercises,
    db.workoutTemplates,
    db.workouts,
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workoutTemplates.clear(),
        db.workouts.clear(),
      ])
      await db.exercises.bulkAdd(backup.exercises)
      await db.workoutTemplates.bulkAdd(backup.workoutTemplates)
      await db.workouts.bulkAdd(backup.workouts)
    },
  )
}

export async function getLastBackupAt(): Promise<string | undefined> {
  return (await db.metadata.get(LAST_BACKUP_AT_METADATA_ID))?.value
}

export async function setLastBackupAt(createdAt: string): Promise<void> {
  await db.metadata.put({ id: LAST_BACKUP_AT_METADATA_ID, value: createdAt })
}

export function createBackupFilename(createdAt: Date): string {
  return `replog-backup-${format(createdAt, 'yyyy-MM-dd')}.json`
}
