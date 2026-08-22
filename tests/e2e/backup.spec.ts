import { expect, test } from '@playwright/test'

test('downloads an empty backup and records its creation date', async ({
  page,
}) => {
  await page.goto('/backup')

  await expect(page.getByTestId('last-backup-at')).toContainText(
    'Резервных копий',
  )

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Скачать копию' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(
    /^replog-backup-\d{4}-\d{2}-\d{2}\.json$/,
  )
  await expect(page.getByTestId('last-backup-at')).toContainText(
    'Последняя копия',
  )
})
