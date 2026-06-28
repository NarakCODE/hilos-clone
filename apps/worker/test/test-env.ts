/**
 * Resolves the backend test-harness environment for @acw/worker.
 *
 * Mirrors the @acw/api harness. Backend unit/property tests run without
 * external services; integration tests (added in later tasks) run against a
 * dedicated test Postgres + Redis. The connection strings come from
 * `TEST_DATABASE_URL` / `TEST_REDIS_URL` (see the repo `.env.example`), falling
 * back to the documented local defaults so the harness is runnable out of the
 * box.
 */

/** Default test Postgres URL (mirrors `.env.example`). */
export const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/acw_test?schema=public";

/** Default test Redis URL (mirrors `.env.example`, db index 1). */
export const DEFAULT_TEST_REDIS_URL = "redis://localhost:6379/1";

export interface TestEnv {
  nodeEnv: string;
  databaseUrl: string;
  redisUrl: string;
}

/**
 * Apply test environment defaults to `process.env` and return the resolved
 * values. Safe to call repeatedly; existing values are never overwritten.
 */
export function loadTestEnv(): TestEnv {
  process.env.NODE_ENV = "test";

  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_TEST_DATABASE_URL;

  const redisUrl =
    process.env.TEST_REDIS_URL ??
    process.env.REDIS_URL ??
    DEFAULT_TEST_REDIS_URL;

  // Point the Prisma client (`@acw/database`) at the test database for any
  // integration test that instantiates it.
  process.env.DATABASE_URL = databaseUrl;
  process.env.TEST_DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.TEST_REDIS_URL = redisUrl;

  return {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl,
    redisUrl,
  };
}
