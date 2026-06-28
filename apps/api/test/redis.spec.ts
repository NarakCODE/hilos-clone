import { isRedisReachable } from "./redis";

describe("isRedisReachable", () => {
  const original = process.env.TEST_REDIS_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TEST_REDIS_URL;
    } else {
      process.env.TEST_REDIS_URL = original;
    }
  });

  it("resolves false quickly when Redis is not reachable", async () => {
    // Port 1 is reserved and never listening: the helper should report
    // unreachable rather than hang, so integration tests can skip gracefully.
    process.env.TEST_REDIS_URL = "redis://127.0.0.1:1";
    await expect(isRedisReachable(300)).resolves.toBe(false);
  });

  it("resolves false for a malformed redis url", async () => {
    process.env.TEST_REDIS_URL = "not a url";
    await expect(isRedisReachable(300)).resolves.toBe(false);
  });
});
