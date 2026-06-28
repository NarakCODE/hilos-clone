/**
 * Job payload shapes for the worker queues.
 *
 * These describe the minimal data the API enqueues; the actual processors
 * (Agent_Runner in task 13.x, Webhook_Processor in task 17.x) consume them.
 * Kept intentionally small — the processors load full entities from Postgres
 * by id rather than trusting large payloads off the queue.
 */

/** Payload for an `agent-run` job (Req 7.1). */
export interface AgentRunJobData {
  /** The `agent_run` row id created by the API (status `pending`). */
  readonly agentRunId: string;
  /** Workspace the run belongs to (for scoping + realtime fan-out). */
  readonly workspaceId: string;
  /** Room the run was triggered in. */
  readonly roomId: string;
}

/** Payload for a `webhook` job (Req 10.x). */
export interface WebhookJobData {
  /** GitHub delivery id used for idempotent deduplication (Req 10.8). */
  readonly deliveryId: string;
  /** GitHub event type (e.g. `pull_request`, `push`). */
  readonly eventType: string;
  /** The verified raw webhook payload. */
  readonly payload: unknown;
}

/** Map of queue name -> job data, for typing the queue instances. */
export interface QueueJobDataMap {
  "agent-run": AgentRunJobData;
  webhook: WebhookJobData;
}
