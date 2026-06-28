import { connect } from "node:net";
import { loadTestEnv } from "./test-env";

/**
 * Test Redis helpers (mirrors the @acw/api harness).
 *
 * The worker talks to Redis for the BullMQ queues and the realtime pub/sub
 * publisher. Integration tests that need a live Redis use
 * {@link isRedisReachable} to skip gracefully when no test Redis is available,
 * mirroring {@link ./db.isDatabaseReachable} for Postgres. To keep the
 * reachability probe dependency-free (and avoid spinning up a real client just
 * to decide whether to skip), it performs a raw TCP `PING`. The connection
 * string comes from `TEST_REDIS_URL` (see the repo `.env.example`).
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
