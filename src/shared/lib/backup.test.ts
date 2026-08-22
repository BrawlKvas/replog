import { describe, expect, it } from 'vitest'
import { createBackupFilename } from './backup'

describe('createBackupFilename', () => {
  it('uses the backup creation date in the filename', () => {
    expect(createBackupFilename(new Date(2026, 7, 22))).toBe(
      'replog-backup-2026-08-22.json',
    )
  })
})
