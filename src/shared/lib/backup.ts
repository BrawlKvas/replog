import { format } from 'date-fns'

export function createBackupFilename(createdAt: Date): string {
  return `replog-backup-${format(createdAt, 'yyyy-MM-dd')}.json`
}
