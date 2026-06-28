import type { RedisOptions } from "ioredis";

/**
 * Worker runtime configuration.
 *
 * All values are sourced from environment variables documented in the repo
 * root `.env.example` (Redis, queue, LLM provider). This module centralizes
 * env reads so the rest of the worker depends on a typed config object rather
 * than `process.env` directly.
 */
export interface WorkerConfig {
  /** `development` | `test` | `production` (from `NODE_ENV`). */
  readonly nodeEnv: string;
  /** Redis connection string (from `REDIS_URL`). */
  readonly redisUrl: string;
  /**
   * ioredis connection options derived from {@link redisUrl}, shaped for
   * BullMQ. `maxRetriesPerRequest` is `null` as required by BullMQ blocking
   * commands (workers).
   */
  readonly redisConnection: RedisOptions;
  /** LLM provider settings consumed by the agent runner (task 13.x). */
  readonly llm: {
    readonly baseUrl: string;
    readonly apiKey: string;
    readonly model: string;
  };
}

/**
 * Parse a `redis://` / `rediss://` URL into ioredis {@link RedisOptions}.
 *
 * Passing structured options (rather than a shared client instance) lets
 * BullMQ create the separate blocking/non-blocking connections it needs.
 */
export function parseRedisUrl(redisUrl: string): RedisOptions {
  let url: URL;
  try {
    url = new URL(redisUrl);
  } catch {
    // Fall back to local defaults if the URL is malformed; surfaced clearly
    // by BullMQ on first connect rather than crashing config load.
    return { host: "localhost", port: 6379 };
  }

  const isTls = url.protocol === "rediss:";
  const dbSegment = url.pathname.replace(/^\//, "");
  const db = dbSegment ? Number(dbSegment) : 0;

  const options: RedisOptions = {
    host: url.hostname || "localhost",
    port: url.port ? Number(url.port) : 6379,
    db: Number.isNaN(db) ? 0 : db,
  };

  if (url.username) {
    options.username = decodeURIComponent(url.username);
  }
  if (url.password) {
    options.password = decodeURIComponent(url.password);
  }
  if (isTls) {
    options.tls = {};
  }

  return options;
}

/** Resolve the worker configuration from the current environment. */
export function loadWorkerConfig(): WorkerConfig {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    redisUrl,
    redisConnection: {
      ...parseRedisUrl(redisUrl),
      // Required by BullMQ for workers (blocking commands).
      maxRetriesPerRequest: null,
    },
    llm: {
      baseUrl: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1",
      apiKey: process.env.LLM_API_KEY ?? "",
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
    },
  };
}

/** DI token for the resolved {@link WorkerConfig}. */
export const WORKER_CONFIG = Symbol("WORKER_CONFIG");
