import { expect, test } from '@playwright/test'

test('records, updates, edits, and deletes body weight', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Вес тела' }).click()

  await expect(page).toHaveURL(/\/body-weight$/)
  await expect(page.getByText('Записей пока нет')).toBeVisible()

  await page.getByLabel('Вес, кг').fill('87.55')
  await page.getByRole('button', { name: 'Сохранить вес' }).click()
  await expect(page.getByText('87,55 кг').first()).toBeVisible()

  await page.getByLabel('Вес, кг').fill('76.1')
  await page.getByRole('button', { name: 'Сохранить вес' }).click()
  await expect(page.getByText('76,1 кг').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Изменить' })).toHaveCount(1)

  await page.getByRole('button', { name: 'Изменить' }).click()
  await page.getByLabel('Вес, кг').fill('75.8')
  await page.getByRole('button', { name: 'Сохранить изменения' }).click()
  await expect(page.getByText('75,8 кг').first()).toBeVisible()

  await page.getByRole('button', { name: /Удалить запись за/ }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Удалить' })
    .click()
  await expect(page.getByText('Записей пока нет')).toBeVisible()
})
