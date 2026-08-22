# Replog Development Guide

## Project

Replog is a personal, offline-first PWA training diary. It has no backend, authentication, or runtime network API. Training data belongs only on the user's device in IndexedDB.

## Stack

- React 19 and TypeScript in strict mode
- Vite and `vite-plugin-pwa`
- Tailwind CSS 4
- Dexie for IndexedDB
- Zustand for transient UI state
- React Hook Form and Zod for forms and validation
- date-fns for date operations
- Vitest for unit tests and Playwright for E2E tests
- GitHub Pages deployed through GitHub Actions

## Requirements

- Node.js 22.12 or newer
- Yarn 4.6.0 through Corepack

```bash
corepack enable
yarn install
```

## Commands

```bash
yarn dev
yarn lint
yarn format:check
yarn test
yarn test:e2e
yarn build
```

Before the first local E2E run, install Chromium with `yarn playwright install chromium`.

## Source Layout

- `src/app`: application bootstrap and global providers
- `src/db`: Dexie database definition and schema migrations
- `src/entities`: domain models shared by features
- `src/features`: user-facing training workflows
- `src/pages`: route-level screens
- `src/shared`: reusable UI, utilities, and cross-cutting code
- `tests/e2e`: Playwright end-to-end scenarios

Keep domain data in IndexedDB. Zustand must not become a second persistent source of truth.

## Data and Backups

- Do not add a backend or remote API without an explicit product decision.
- All schema changes require a Dexie migration and backward-compatible import handling.
- Backups use versioned JSON. Validate imported JSON with Zod before writing to IndexedDB.
- Exported backup files contain private training data. Never commit them.
- Browser-initiated file downloads require a user gesture; use reminders rather than automatic backup downloads.

## PWA and Deployment

- Preserve the PWA manifest, service worker, offline navigation fallback, and update prompt.
- GitHub Pages uses `/replog/` as the production base path in `vite.config.ts`. Update it if the repository name changes.
- Workflows live in `.github/workflows`. Corepack must be enabled before any Yarn command.
- `actions/setup-node` must retain `package-manager-cache: false`; its automatic cache invokes the runner's Yarn 1 before Corepack is enabled.

## Testing and Validation

- Write unit tests for domain logic, data migrations, validation, import/export, and calculations.
- Write Playwright tests for critical user flows and mobile viewport behavior.
- Do not add component tests or React Testing Library.
- Run `yarn lint`, `yarn format:check`, `yarn test`, and `yarn build` after code changes. Run `yarn test:e2e` for user-flow changes.

## Code Style

- Use TypeScript and follow the existing Prettier and Oxlint configuration.
- Prefer small, direct implementations over unnecessary abstractions.
- Keep UI mobile-first, accessible, and usable offline.
