import { loadTestEnv } from "./test-env";

/**
 * Jest global setup: runs once before the whole suite.
 *
 * Resolves the test Postgres/Redis environment (TEST_DATABASE_URL /
 * TEST_REDIS_URL) so integration tests can connect to dedicated test
 * services. Unit and property tests do not require these services to be
 * reachable; integration tests added in later tasks connect lazily and skip
 * with a clear message when the services are unavailable.
 */
export default async function globalSetup(): Promise<void> {
  const env = loadTestEnv();
  // eslint-disable-next-line no-console
  console.log(
    `[test] harness env ready (NODE_ENV=${env.nodeEnv}, db=${maskUrl(
      env.databaseUrl,
    )}, redis=${maskUrl(env.redisUrl)})`,
  );
}

/** Hide credentials when logging connection strings. */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
