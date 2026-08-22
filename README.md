# Replog

Личный PWA-дневник тренировок. Данные хранятся в IndexedDB на устройстве и не отправляются на сервер.

## Требования

- Node.js 22.12 или новее
- Yarn 4 через Corepack

## Команды

```bash
corepack enable
yarn install
yarn dev
yarn lint
yarn format:check
yarn test
yarn test:e2e
yarn build
```

Перед первым E2E-запуском установите браузер Playwright:

```bash
yarn playwright install chromium
```

## Деплой

Push в `main` собирает приложение и публикует его через GitHub Pages. В настройках репозитория откройте **Settings → Pages** и выберите источник **GitHub Actions**.

Собранная версия использует путь `/replog/`. Если репозиторий будет переименован, обновите значение `base` в `vite.config.ts`.
