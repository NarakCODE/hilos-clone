# Repository Guidelines

## Project Structure & Module Organization

This repository is a small wrapper around the Next.js app in `web/`. Most
commands should be run from `web/`.

- `web/app/` contains App Router routes, layouts, and global CSS.
- `web/components/` contains reusable UI and feature components. Use
  `components/ui` and `components/data-grid` before adding new primitives.
- `web/lib/` contains route metadata, domain types, mock data, and view-model
  helpers.
- `web/public/` contains static assets such as logos, favicons, and file icons.
- `docs/` contains product and technical reference material.

Follow `web/PROJECT_RULES.md` for architecture decisions. Route files should
stay thin, feature logic should live in `components/<feature>` or
`lib/<feature>`, and demo data should not be embedded in view components.

## Build, Test, and Development Commands

Run these from `web/`:

- `pnpm install` installs dependencies with the locked pnpm version.
- `pnpm dev` starts the Next.js development server with Turbopack.
- `pnpm build` creates a production build.
- `pnpm start` runs the production server after a build.
- `pnpm lint` runs ESLint with Next.js core web vitals and TypeScript rules.
- `pnpm typecheck` runs `tsc --noEmit`.
- `pnpm check:guardrails` checks design-token drift and route thinness.
- `pnpm format` formats `ts` and `tsx` files with Prettier.

## Coding Style & Naming Conventions

Use TypeScript, React 19, Next.js App Router, Tailwind CSS v4, and shadcn-style
composition. Prettier uses 2 spaces, double quotes, no semicolons, trailing
commas where valid in ES5, and Tailwind class sorting. Prefer semantic tokens
such as `bg-background`, `text-muted-foreground`, and `border-border` over raw
color values. Name feature components and hooks by role, for example
`ticket-detail-page.tsx` and `use-tickets-page-state.ts`.

## Testing Guidelines

There is currently no dedicated test script or test framework configured.
Before submitting changes, run `pnpm check:guardrails`, `pnpm lint`,
`pnpm typecheck`, and `pnpm build`. If you add tests, document the new command
and keep test files close to the feature they cover.

## Commit & Pull Request Guidelines

Recent commits use Conventional Commits, such as
`feat(knowledge-base): ...` and `fix(tickets): ...`. Keep commits focused and
scoped to one concern.

Before opening a PR, install hooks with `pnpm install:git-hooks`, run the local
checks, and include a clear summary, rationale, linked issue when relevant, and
screenshots or recordings for UI changes. Keep large feature proposals in an
issue before implementation.
