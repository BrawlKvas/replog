import { describe, expect, it } from 'vitest'
import {
  createBackupFilename,
  parseBackup,
  serializeBackup,
  type BackupSnapshot,
} from './backup'

describe('createBackupFilename', () => {
  it('uses the backup creation date in the filename', () => {
    expect(createBackupFilename(new Date(2026, 7, 22))).toBe(
      'replog-backup-2026-08-22.json',
    )
  })
})

describe('backup serialization', () => {
  const snapshot: BackupSnapshot = {
    createdAt: '2026-08-22T10:30:00.000Z',
    exercises: [
      {
        id: 'exercise-1',
        name: 'Приседания',
        image: new Blob(['exercise image'], { type: 'image/webp' }),
        tags: ['ноги'],
        createdAt: '2026-08-20T10:30:00.000Z',
        updatedAt: '2026-08-21T10:30:00.000Z',
      },
    ],
    workoutTemplates: [
      {
        id: 'template-1',
        name: 'Ноги',
        exercises: [{ exerciseId: 'exercise-1', sets: 3 }],
        createdAt: '2026-08-20T10:30:00.000Z',
        updatedAt: '2026-08-21T10:30:00.000Z',
      },
    ],
    workouts: [
      {
        id: 'workout-1',
        templateId: 'template-1',
        status: 'completed',
        exercises: [
          {
            id: 'workout-exercise-1',
            exerciseId: 'exercise-1',
            sets: [{ weight: 100, repetitions: 5, rir: 2, technique: 8 }],
          },
        ],
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        startedAt: '2026-08-22T10:00:00.000Z',
        completedAt: '2026-08-22T10:30:00.000Z',
      },
    ],
  }

  it('round-trips all data including exercise images', async () => {
    const backup = await parseBackup(await serializeBackup(snapshot))

    expect(backup.createdAt).toBe(snapshot.createdAt)
    expect(backup.workoutTemplates).toEqual(snapshot.workoutTemplates)
    expect(backup.workouts).toEqual(snapshot.workouts)
    expect(backup.exercises[0]).toMatchObject({
      ...snapshot.exercises[0],
      image: expect.any(Blob),
    })
    await expect(backup.exercises[0].image.text()).resolves.toBe(
      'exercise image',
    )
    expect(backup.exercises[0].image.type).toBe('image/webp')
  })

  it('rejects unsupported backup versions before restoring data', async () => {
    const json = await serializeBackup(snapshot)
    const incompatible = JSON.stringify({ ...JSON.parse(json), version: 2 })

    await expect(parseBackup(incompatible)).rejects.toThrow(
      'Файл резервной копии имеет неподдерживаемый формат.',
    )
  })

  it('rejects malformed JSON', async () => {
    await expect(parseBackup('{')).rejects.toThrow(
      'Не удалось прочитать файл резервной копии.',
    )
  })
})
