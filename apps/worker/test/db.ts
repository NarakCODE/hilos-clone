import { PrismaClient } from "@acw/database";
import { loadTestEnv } from "./test-env";

/**
 * Test Postgres helpers (mirrors the @acw/api harness).
 *
 * Integration tests (added in later tasks) use {@link getTestPrisma} to obtain
 * a Prisma client bound to `TEST_DATABASE_URL`, and {@link isDatabaseReachable}
 * to skip gracefully when no test database is available in the environment.
 */

let client: PrismaClient | undefined;

/** Lazily create (once) a Prisma client pointed at the test database. */
export function getTestPrisma(): PrismaClient {
  if (!client) {
    const env = loadTestEnv();
    client = new PrismaClient({
      datasources: { db: { url: env.databaseUrl } },
      log: ["warn", "error"],
    });
  }
  return client;
}

/** Returns true if the test Postgres is reachable; used to skip integration tests. */
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await getTestPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Disconnect the shared test client (call from `afterAll`). */
export async function disconnectTestPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
}
