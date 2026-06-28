# @acw/api

NestJS REST API + WebSocket gateway for the AI Collaboration Workspace
(stateless, scales horizontally behind a load balancer). This package owns the
HTTP entry point, the cross-cutting infrastructure, and the domain modules
(added incrementally by later tasks).

## What this scaffold provides (task 1.4)

- **Bootable Nest app** — `src/main.ts` + `src/app.module.ts`, with a
  `GET /health` liveness endpoint.
- **Global exception filter** (`src/common/filters`) mapping domain errors to
  the shared envelope `{ error: { code, message, fields? } }`:

  | Error | HTTP | `code` |
  | --- | --- | --- |
  | `ValidationError` | 400 | `VALIDATION_ERROR` |
  | `UnauthenticatedError` | 401 | `UNAUTHENTICATED` |
  | `AuthorizationError` | 403 | `FORBIDDEN` |
  | `NotFoundError` | 404 | `NOT_FOUND` |
  | `ConflictError` | 409 | `CONFLICT` |
  | `StateGuardError` | 422 | `UNPROCESSABLE_STATE` |

  Domain exception classes live in `src/common/errors`.

- **Zod validation pipe** (`src/common/pipes`) — validates request
  body/query/params against the shared schemas in `@acw/shared` and throws a
  400 `ValidationError` (populating `fields`) on failure.
- **Cursor-pagination helper** (`src/common/pagination`) — produces the shared
  `{ items, nextCursor }` shape from the `?cursor=<id>&limit=<n>` convention.

## Scripts

Run from the repo root with `pnpm --filter @acw/api <script>` (or from
`apps/api`):

| Script | Description |
| --- | --- |
| `dev` | Run the API with `ts-node` (`src/main.ts`). |
| `build` | Type-check and emit to `dist/` (`tsc -b`). |
| `start` | Run the built server (`node dist/main.js`). |
| `typecheck` | Type-check without running. |
| `test` | Run the Jest test suite (unit + property-based). |
| `test:watch` | Run Jest in watch mode. |

### Tests

```bash
# from the repo root
pnpm --filter @acw/api test

# or from apps/api
pnpm test
```

The harness uses **Jest** (ts-jest) plus **fast-check** for property-based
tests. Test files are co-located as `*.spec.ts` under `src/`, with shared setup
in `test/`:

- `test/global-setup.ts` resolves the test environment once per run.
- `test/jest.setup.ts` wires `reflect-metadata` (NestJS DI) and fast-check
  global settings.
- `test/test-env.ts` reads `TEST_DATABASE_URL` / `TEST_REDIS_URL` (see the repo
  `.env.example`), falling back to local defaults
  (`postgresql://postgres:postgres@localhost:5432/acw_test`,
  `redis://localhost:6379/1`).
- `test/db.ts` exposes a test Prisma client and an `isDatabaseReachable()`
  guard so integration tests (added later) can skip gracefully when no test
  Postgres is available.
- `test/redis.ts` exposes an `isRedisReachable()` guard (a dependency-free TCP
  `PING` against `TEST_REDIS_URL`) so realtime integration tests added later
  can skip gracefully when no test Redis is available.

Unit and property tests run without external services. Integration tests added
in later tasks require a running **test Postgres** and **test Redis**; start
them and set `TEST_DATABASE_URL` / `TEST_REDIS_URL` before running the suite.

## Environment

Configuration is read from environment variables documented in the repo-root
`.env.example` (Postgres, Redis, session cookies, GitHub App, LLM provider).
Copy it to `.env` and fill in real values for local development.
