import { expect, test } from '@playwright/test'

test('opens the Replog home screen', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Тренировки остаются твоими.' }),
  ).toBeVisible()
  await expect(page.getByTestId('storage-status')).toContainText('хранилище')
})
