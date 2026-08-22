import { expect, test } from '@playwright/test'

const image = {
  name: 'exercise.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1000"><rect width="2000" height="1000" fill="#537441"/></svg>',
  ),
}

test('creates, edits, and deletes an exercise', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Открыть упражнения' }).click()
  await expect(page).toHaveURL(/\/exercises$/)
  await page.getByRole('link', { name: 'Добавить упражнение' }).last().click()
  await expect(page).toHaveURL(/\/exercises\/new$/)

  await page.locator('input[type="file"]').setInputFiles(image)
  await expect
    .poll(() =>
      page
        .getByAltText('Предпросмотр упражнения')
        .evaluate((imageElement) => imageElement.naturalWidth),
    )
    .toBe(1600)
  await page.getByLabel('Название').fill('Приседания')
  await page.getByLabel(/Описание/).fill('Со штангой')
  await page.getByLabel(/Теги/).fill('ноги, сила, Ноги')
  await page.getByRole('button', { name: 'Сохранить упражнение' }).click()

  await expect(page).toHaveURL(/\/exercises$/)
  await expect(page.getByRole('link', { name: /Приседания/ })).toBeVisible()
  await page.getByRole('link', { name: /Приседания/ }).click()
  await expect(page).toHaveURL(/\/exercises\/[\w-]+$/)
  await expect
    .poll(() =>
      page
        .getByAltText('Предпросмотр упражнения')
        .evaluate((imageElement) => imageElement.naturalWidth),
    )
    .toBe(1600)
  await page.goBack()
  await expect(page).toHaveURL(/\/exercises$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/exercises\/[\w-]+$/)
  await page.getByLabel('Название').fill('Фронтальные приседания')
  await page.getByRole('button', { name: 'Сохранить упражнение' }).click()

  await expect(
    page.getByRole('link', { name: /Фронтальные приседания/ }),
  ).toBeVisible()
  await page.getByRole('link', { name: /Фронтальные приседания/ }).click()
  await page.getByRole('button', { name: 'Удалить упражнение' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Удалить' })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Первое упражнение' }),
  ).toBeVisible()
})

test('shows a missing exercise route', async ({ page }) => {
  await page.goto('/exercises/missing')

  await expect(
    page.getByRole('heading', { name: 'Упражнение не найдено' }),
  ).toBeVisible()
})
