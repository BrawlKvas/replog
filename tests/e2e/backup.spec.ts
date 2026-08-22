import { expect, test } from '@playwright/test'

const appBasePath = process.env.GITHUB_ACTIONS === 'true' ? '/replog' : ''

test('downloads an empty backup and records its creation date', async ({
  page,
}) => {
  await page.goto(`${appBasePath}/backup`)

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

test('resets all local data after confirmation', async ({ page }) => {
  await page.goto(`${appBasePath}/backup`)

  const backup = JSON.stringify({
    format: 'replog-backup',
    version: 1,
    createdAt: '2026-08-22T10:30:00.000Z',
    exercises: [
      {
        id: 'exercise-1',
        name: 'Приседания',
        image: { base64: '', type: 'image/svg+xml' },
        tags: [],
        createdAt: '2026-08-20T10:30:00.000Z',
        updatedAt: '2026-08-21T10:30:00.000Z',
      },
    ],
    workoutTemplates: [],
    workouts: [],
  })

  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  })
  await page.getByRole('button', { name: 'Восстановить из файла' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Восстановить' })
    .click()
  await expect(
    page.getByText('Данные восстановлены из резервной копии.'),
  ).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Скачать копию' }).click()
  await downloadPromise
  await expect(page.getByTestId('last-backup-at')).toContainText(
    'Последняя копия',
  )

  await page.getByRole('button', { name: 'Очистить все данные' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Очистить' })
    .click()

  await expect(page).toHaveURL(new RegExp(`${appBasePath}/?$`))
  await expect(page.getByTestId('home-last-backup-at')).toContainText(
    'Резервных копий',
  )
  await page.getByRole('link', { name: 'Упражнения' }).click()
  await expect(
    page.getByRole('heading', { name: 'Первое упражнение' }),
  ).toBeVisible()
})
