import * as fc from "fast-check";
import {
  loadWorkerConfig,
  parseRedisUrl,
} from "./worker-config";

describe("parseRedisUrl", () => {
  it("parses host, port, and db index from a redis url", () => {
    const opts = parseRedisUrl("redis://localhost:6380/3");
    expect(opts.host).toBe("localhost");
    expect(opts.port).toBe(6380);
    expect(opts.db).toBe(3);
    expect(opts.tls).toBeUndefined();
  });

  it("defaults to port 6379 and db 0 when omitted", () => {
    const opts = parseRedisUrl("redis://localhost");
    expect(opts.port).toBe(6379);
    expect(opts.db).toBe(0);
  });

  it("extracts username and password credentials", () => {
    const opts = parseRedisUrl("redis://user:secret@redis.example.com:6379");
    expect(opts.username).toBe("user");
    expect(opts.password).toBe("secret");
    expect(opts.host).toBe("redis.example.com");
  });

  it("enables tls for rediss:// urls", () => {
    const opts = parseRedisUrl("rediss://redis.example.com:6379");
    expect(opts.tls).toEqual({});
  });

  it("falls back to local defaults for a malformed url", () => {
    const opts = parseRedisUrl("not a url");
    expect(opts.host).toBe("localhost");
    expect(opts.port).toBe(6379);
  });

  it("never throws and always yields a usable host/port (property)", () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const opts = parseRedisUrl(raw);
        expect(typeof opts.host).toBe("string");
        expect((opts.host ?? "").length).toBeGreaterThan(0);
        expect(typeof opts.port).toBe("number");
        expect(Number.isNaN(opts.port)).toBe(false);
      }),
    );
  });
});

describe("loadWorkerConfig", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("sets maxRetriesPerRequest to null for BullMQ workers", () => {
    const config = loadWorkerConfig();
    expect(config.redisConnection.maxRetriesPerRequest).toBeNull();
  });

  it("reads REDIS_URL and LLM config from the environment", () => {
    process.env.REDIS_URL = "redis://cache:6379/2";
    process.env.LLM_BASE_URL = "https://llm.example.com/v1";
    process.env.LLM_API_KEY = "key-123";
    process.env.LLM_MODEL = "test-model";

    const config = loadWorkerConfig();

    expect(config.redisUrl).toBe("redis://cache:6379/2");
    expect(config.redisConnection.db).toBe(2);
    expect(config.llm).toEqual({
      baseUrl: "https://llm.example.com/v1",
      apiKey: "key-123",
      model: "test-model",
    });
  });
});
