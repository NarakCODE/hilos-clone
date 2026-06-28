import { Module, type OnModuleDestroy } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Queue, type DefaultJobOptions } from "bullmq";
import {
  loadWorkerConfig,
  WORKER_CONFIG,
  type WorkerConfig,
} from "../config/worker-config";
import {
  AGENT_RUN_QUEUE,
  QUEUE_NAMES,
  WEBHOOK_QUEUE,
} from "./queue-names";
import type { AgentRunJobData, WebhookJobData } from "./job-types";

/**
 * Default retry/cleanup policy applied to enqueued jobs. The API enqueues with
 * these defaults; processors (tasks 13.x/17.x) can override per-job.
 */
const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

/**
 * Provides the BullMQ {@link Queue} instances for the agent-run and webhook
 * queues, wired to the Redis connection from {@link WorkerConfig}.
 *
 * This module establishes the queue infrastructure only. The consumers
 * (`Worker`s) that process jobs are added by later tasks (Agent_Runner 13.x,
 * Webhook_Processor 17.x); the `Queue` objects here support enqueue/inspect and
 * are also reused by the API producer side via the shared queue names.
 */
@Module({
  providers: [
    {
      provide: WORKER_CONFIG,
      useFactory: (): WorkerConfig => loadWorkerConfig(),
    },
    {
      provide: AGENT_RUN_QUEUE,
      inject: [WORKER_CONFIG],
      useFactory: (config: WorkerConfig): Queue<AgentRunJobData> =>
        new Queue<AgentRunJobData>(QUEUE_NAMES.AGENT_RUN, {
          connection: config.redisConnection,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        }),
    },
    {
      provide: WEBHOOK_QUEUE,
      inject: [WORKER_CONFIG],
      useFactory: (config: WorkerConfig): Queue<WebhookJobData> =>
        new Queue<WebhookJobData>(QUEUE_NAMES.WEBHOOK, {
          connection: config.redisConnection,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        }),
    },
  ],
  exports: [WORKER_CONFIG, AGENT_RUN_QUEUE, WEBHOOK_QUEUE],
})
export class QueuesModule implements OnModuleDestroy {
  constructor(
    @Inject(AGENT_RUN_QUEUE) private readonly agentRunQueue: Queue,
    @Inject(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  /** Close queue connections cleanly on shutdown. */
  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.agentRunQueue.close(), this.webhookQueue.close()]);
  }
}
