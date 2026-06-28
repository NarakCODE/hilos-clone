# @acw/worker

Background worker for the AI Collaboration Workspace. It runs the long-running
jobs that must not block the API: the **agent runner** (executes agent runs via
`packages/agent-core` + the LLM provider) and the **GitHub webhook processor**.
The worker scales independently of the stateless API.

The worker is a headless NestJS application context (no HTTP server). It owns
the BullMQ queue connections and a Redis pub/sub publisher; it never talks to
clients directly — it publishes realtime events to Redis, and the API's
socket.io Redis adapter fans them out to connected WebSocket clients.

## What this scaffold provides (task 1.5)

- **Bootable worker** — `src/main.ts` + `src/app.module.ts`, started as a Nest
  application context with shutdown hooks so Redis connections close cleanly.
- **Queue infrastructure** (`src/queues`) — BullMQ `Queue` instances for the
  two queues, wired to the Redis connection from the worker config:

  | Queue | Name | Producer | Consumer (later task) |
  | --- | --- | --- | --- |
  | Agent run | `agent-run` | API on agent mention (12.x) | Agent_Runner (13.x) |
  | Webhook | `webhook` | API after HMAC verify (17.x) | Webhook_Processor (17.x) |

  Queue names and DI tokens live in `src/queues/queue-names.ts`; job payload
  shapes in `src/queues/job-types.ts`. Actual job **processors** are added in
  tasks 13.x / 17.x — this task establishes the connections only.

- **Redis pub/sub publisher** (`src/realtime`) — `RealtimePublisher` publishes
  realtime events to room/workspace channels (`realtime:room:<id>` /
  `realtime:workspace:<id>`). Channel helpers and the server-to-client event
  names are in `src/realtime/channels.ts`.

- **Worker config** (`src/config/worker-config.ts`) — typed config resolved
  from the env vars in the repo `.env.example` (`REDIS_URL`, `LLM_*`),
  including the ioredis connection options shaped for BullMQ
  (`maxRetriesPerRequest: null`).

## Scripts

Run from the repo root with `pnpm --filter @acw/worker <script>` (or from
`apps/worker`):

| Script | Description |
| --- | --- |
| `dev` | Run the worker with `ts-node` (`src/main.ts`). |
| `build` | Type-check and emit to `dist/` (`tsc -b`). |
| `start` | Run the built worker (`node dist/main.js`). |
| `typecheck` | Type-check without running. |
| `test` | Run the Jest test suite (unit + property-based). |
| `test:watch` | Run Jest in watch mode. |

### Tests

```bash
# from the repo root
pnpm --filter @acw/worker test

# or from apps/worker
pnpm test
```

The harness mirrors `@acw/api`: **Jest** (ts-jest) plus **fast-check** for
property-based tests. Test files are co-located as `*.spec.ts` under `src/`,
with shared setup in `test/`:

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
  `PING` against `TEST_REDIS_URL`) so queue/realtime integration tests added
  later can skip gracefully when no test Redis is available.

Unit and property tests run without external services. Integration tests added
in later tasks require a running **test Postgres** and **test Redis**; start
them and set `TEST_DATABASE_URL` / `TEST_REDIS_URL` before running the suite.

## Environment

Configuration is read from environment variables documented in the repo-root
`.env.example` (Redis, Postgres, LLM provider). Copy it to `.env` and fill in
real values for local development.
