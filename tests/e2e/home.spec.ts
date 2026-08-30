import { expect, test } from '@playwright/test'

test('opens the Replog home screen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Упражнения' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Шаблоны тренировок' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Резервная копия' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Аналитика' })).toBeVisible()
  await expect(page.getByTestId('home-last-backup-at')).toContainText(
    'Резервных копий',
  )
  await expect(page.getByTestId('storage-status')).toContainText('хранилище')
})

test('opens the regularity analytics screen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Аналитика' }).click()

  await expect(page).toHaveURL(/\/analytics$/)
  await expect(
    page.getByRole('heading', { name: 'Регулярность' }),
  ).toBeVisible()
  await expect(page.getByText('Тренировок пока нет')).toBeVisible()
})
