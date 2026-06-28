import { connect } from "node:net";
import { loadTestEnv } from "./test-env";

/**
 * Test Redis helpers.
 *
 * The API only talks to Redis from the realtime layer (added in a later task),
 * so this harness deliberately avoids pulling in a Redis client dependency.
 * Integration tests that need Redis use {@link isRedisReachable} to skip
 * gracefully when no test Redis is available, mirroring
 * {@link ./db.isDatabaseReachable} for Postgres. The connection string comes
 * from `TEST_REDIS_URL` (see the repo `.env.example`).
 */

/**
 * Returns true if the test Redis is reachable. Performs a dependency-free
 * `PING` over a raw TCP socket and checks for the `+PONG` reply, so the api
 * harness does not need a Redis client until the realtime module adds one.
 *
 * @param timeoutMs Connection/handshake timeout. Defaults to 1000ms.
 */
export function isRedisReachable(timeoutMs = 1000): Promise<boolean> {
  const env = loadTestEnv();
  let url: URL;
  try {
    url = new URL(env.redisUrl);
  } catch {
    return Promise.resolve(false);
  }

  const host = url.hostname || "localhost";
  const port = Number(url.port || 6379);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (reachable: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(reachable);
    };

    const socket = connect({ host, port });
    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      socket.write("PING\r\n");
    });
    socket.on("data", (chunk) => {
      finish(chunk.toString("utf8").startsWith("+PONG"));
    });
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}
