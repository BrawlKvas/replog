import { expect, test, type Page } from '@playwright/test'

const image = {
  name: 'exercise.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1000"><rect width="2000" height="1000" fill="#537441"/></svg>',
  ),
}

async function createExercise(page: Page, name: string) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Упражнения' }).click()
  await page.getByRole('link', { name: 'Добавить упражнение' }).last().click()
  await page.locator('input[type="file"]').setInputFiles(image)
  await page.getByLabel('Название').fill(name)
  await page.getByRole('button', { name: 'Сохранить упражнение' }).click()
  await expect(page).toHaveURL(/\/exercises$/)
}

async function createTemplate(
  page: Page,
  name: string,
  exercises: Array<{ name: string; sets: number }>,
) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Шаблоны тренировок' }).click()
  await page.getByRole('link', { name: 'Добавить шаблон тренировки' }).click()
  await page.getByLabel('Название').fill(name)

  for (const exercise of exercises) {
    await page.getByRole('button', { name: 'Добавить' }).click()
    await page
      .getByLabel('Упражнение')
      .last()
      .selectOption({ label: exercise.name })
    await page.getByLabel('Подходы').last().fill(String(exercise.sets))
  }

  await page.getByRole('button', { name: 'Сохранить шаблон' }).click()
  await expect(page).toHaveURL(/\/workout-templates$/)
}

async function fillResult(page: Page, weight: string) {
  await page.getByLabel('Вес, кг').fill(weight)
  await page.getByLabel('Повторения').fill('8')
  await page.getByLabel('RIR').fill('2')
  await page.getByLabel('Техника, 1–10').fill('8')
}

test('conducts a workout, saves the result, and shows it next time', async ({
  page,
}) => {
  await createExercise(page, 'Приседания')
  await createTemplate(page, 'День ног', [{ name: 'Приседания', sets: 2 }])

  await page.getByRole('button', { name: 'Начать тренировку' }).click()
  await expect(page.getByRole('heading', { name: 'Приседания' })).toBeVisible()
  await expect(page.locator('img')).toBeVisible()
  await expect(page.getByText('Нет данных')).toBeVisible()

  await fillResult(page, '80')
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('Подход 2 из 2')).toBeVisible()
  await fillResult(page, '75')
  await page.getByRole('button', { name: 'Завершить' }).click()
  await expect(page.getByText('Тренировка завершена')).toBeVisible()
  await expect(page.getByText(/80 кг x 8, RIR 2, техника 8\/10/)).toBeVisible()

  await page.getByRole('link', { name: 'К шаблонам тренировок' }).click()
  await page.getByRole('button', { name: 'Начать тренировку' }).click()
  await expect(page.getByText('80 кг x 8, RIR 2, техника 8/10')).toBeVisible()
})

test('shows an active workout on the home screen', async ({ page }) => {
  await createExercise(page, 'Приседания')
  await createTemplate(page, 'День ног', [{ name: 'Приседания', sets: 1 }])

  await page.getByRole('button', { name: 'Начать тренировку' }).click()
  await expect(page.getByRole('heading', { name: 'Приседания' })).toBeVisible()
  await page.goto('/')
  await expect(
    page.getByRole('link', { name: 'Продолжить тренировку' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Продолжить тренировку' }).click()
  await expect(page.getByRole('heading', { name: 'Приседания' })).toBeVisible()
})

test('shows completed workouts in history', async ({ page }) => {
  await createExercise(page, 'Приседания')
  await createTemplate(page, 'День ног', [{ name: 'Приседания', sets: 1 }])

  await page.getByRole('button', { name: 'Начать тренировку' }).click()
  await fillResult(page, '80')
  await page.getByRole('button', { name: 'Завершить' }).click()
  await page.goto('/')

  await page.getByRole('link', { name: 'История тренировок' }).click()
  await expect(
    page.getByRole('heading', { name: 'История тренировок' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /День ног/ })).toContainText(
    '1 упражн., 1 подходов',
  )

  await page.getByRole('link', { name: /День ног/ }).click()
  await expect(page.getByText('Тренировка завершена')).toBeVisible()
  await page.getByRole('link', { name: 'К истории тренировок' }).click()
  await expect(
    page.getByRole('heading', { name: 'История тренировок' }),
  ).toBeVisible()
})

test('edits and cancels an active workout without changing its template', async ({
  page,
}) => {
  await createExercise(page, 'Приседания')
  await createExercise(page, 'Тяга')
  await createExercise(page, 'Выпады')
  await createTemplate(page, 'Ноги', [
    { name: 'Приседания', sets: 1 },
    { name: 'Тяга', sets: 1 },
  ])

  await page.getByRole('button', { name: 'Начать тренировку' }).click()
  await fillResult(page, '80')
  await page.getByRole('link', { name: 'План тренировки' }).click()
  await page.getByLabel('Заменить Приседания').selectOption({ label: 'Выпады' })
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Заменить' })
    .click()
  await expect(page.getByLabel('Заменить Выпады')).toBeVisible()

  await page.getByRole('button', { name: 'Отменить тренировку' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Отменить тренировку' })
    .click()
  await expect(page).toHaveURL(/\/workout-templates$/)
  await page.getByRole('link', { name: /Ноги/ }).click()
  await expect(page.getByText('2 упражн., 2 подходов')).toBeVisible()
})
