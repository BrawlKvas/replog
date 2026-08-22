import { expect, test, type Page } from '@playwright/test'

const image = {
  name: 'exercise.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1000"><rect width="2000" height="1000" fill="#537441"/></svg>',
  ),
}

const appBasePath = process.env.GITHUB_ACTIONS === 'true' ? '/replog' : ''

async function createExercise(page: Page) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Упражнения' }).click()
  await page.getByRole('link', { name: 'Добавить упражнение' }).last().click()
  await page.locator('input[type="file"]').setInputFiles(image)
  await page.getByLabel('Название').fill('Приседания')
  await page.getByRole('button', { name: 'Сохранить упражнение' }).click()
  await expect(page).toHaveURL(/\/exercises$/)
}

test('creates, views, edits, and deletes a workout template', async ({
  page,
}) => {
  await createExercise(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Шаблоны тренировок' }).click()
  await expect(page).toHaveURL(/\/workout-templates$/)
  await page.getByRole('link', { name: 'Добавить шаблон тренировки' }).click()

  await page.getByLabel('Название').fill('День ног')
  await page.getByRole('button', { name: 'Добавить' }).click()
  await page.getByLabel('Упражнение').selectOption({ label: 'Приседания' })
  await page.getByLabel('Подходы').fill('3')
  await page.getByRole('button', { name: 'Сохранить шаблон' }).click()

  await expect(page.getByRole('link', { name: /День ног/ })).toBeVisible()
  await page.getByRole('link', { name: /День ног/ }).click()
  await expect(page.getByRole('heading', { name: 'День ног' })).toBeVisible()
  await expect(page.getByText('3 подходов', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Редактировать шаблон' }).click()
  await page.getByLabel('Подходы').fill('4')
  await page.getByRole('button', { name: 'Сохранить шаблон' }).click()
  await expect(page.getByText('4 подходов', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Редактировать шаблон' }).click()
  await page.getByRole('button', { name: 'Удалить шаблон' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Удалить' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Первый шаблон' }),
  ).toBeVisible()
})

test('prevents deleting an exercise used by a workout template', async ({
  page,
}) => {
  await createExercise(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Шаблоны тренировок' }).click()
  await page.getByRole('link', { name: 'Добавить шаблон тренировки' }).click()
  await page.getByLabel('Название').fill('День ног')
  await page.getByRole('button', { name: 'Добавить' }).click()
  await page.getByLabel('Упражнение').selectOption({ label: 'Приседания' })
  await page.getByRole('button', { name: 'Сохранить шаблон' }).click()
  await expect(page).toHaveURL(/\/workout-templates$/)

  await page.goto(`${appBasePath}/exercises`)
  await page.getByRole('link', { name: /Приседания/ }).click()
  await page.getByRole('button', { name: 'Удалить упражнение' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Удалить' })
    .click()
  await expect(
    page.getByText(/Упражнение используется в шаблонах тренировок/),
  ).toBeVisible()
})

test('shows a missing workout template route', async ({ page }) => {
  await page.goto(`${appBasePath}/workout-templates/missing`)

  await expect(
    page.getByRole('heading', { name: 'Шаблон тренировки не найден' }),
  ).toBeVisible()
})
