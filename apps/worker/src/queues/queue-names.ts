/**
 * BullMQ queue names shared between the API (producers) and the worker
 * (consumers). Defined as constants so both sides reference the same string.
 */
export const QUEUE_NAMES = {
  /**
   * Agent run jobs. Enqueued by the API when a user mentions an assigned agent
   * or calls the agent-run endpoint (task 12.x); consumed by the Agent_Runner
   * (task 13.x). Req 7.1.
   */
  AGENT_RUN: "agent-run",
  /**
   * GitHub webhook jobs. Enqueued by the API after HMAC verification of an
   * inbound webhook (task 17.x); consumed by the Webhook_Processor (task 17.x).
   * Req 10.x.
   */
  WEBHOOK: "webhook",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** DI token for the agent-run BullMQ queue instance. */
export const AGENT_RUN_QUEUE = Symbol("AGENT_RUN_QUEUE");

/** DI token for the webhook BullMQ queue instance. */
export const WEBHOOK_QUEUE = Symbol("WEBHOOK_QUEUE");
