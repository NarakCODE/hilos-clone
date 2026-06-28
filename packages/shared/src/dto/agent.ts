import { z } from "zod";
import {
  idSchema,
  isoTimestampSchema,
  metadataSchema,
} from "../common";
import { AgentRunStatus } from "../enums";

/**
 * Agent & agent-run DTOs (Req 6, 7): create, cancel, status.
 */

/** Agent entity DTO (credentials/prompts are never exposed to clients). */
export const agentSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  status: z.string(),
  modelProvider: z.string(),
  modelName: z.string(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});
export type Agent = z.infer<typeof agentSchema>;

/**
 * `POST .../rooms/:roomId/agent-runs` request body (Req 6.1, 6.5, 7.1).
 *
 * A run is created from an assigned-agent mention or a direct call; the source
 * message id is recorded when the run originates from a mention.
 */
export const createAgentRunRequestSchema = z.object({
  agentId: idSchema,
  /** Message that triggered the run, when created from a mention (Req 6.1). */
  sourceMessageId: idSchema.optional(),
  taskType: z.string().min(1).optional(),
  /** Arbitrary task input payload. */
  input: metadataSchema.optional(),
});
export type CreateAgentRunRequest = z.infer<
  typeof createAgentRunRequestSchema
>;

/** `POST .../agent-runs/:agentRunId/cancel` path params (Req 7.6-7.8). */
export const cancelAgentRunParamsSchema = z.object({
  agentRunId: idSchema,
});
export type CancelAgentRunParams = z.infer<typeof cancelAgentRunParamsSchema>;

/** A single recorded progress step of an agent run (Req 7.3). */
export const agentRunStepSchema = z.object({
  id: idSchema,
  agentRunId: idSchema,
  sequence: z.number().int(),
  label: z.string(),
  detail: metadataSchema.nullable(),
  createdAt: isoTimestampSchema,
});
export type AgentRunStep = z.infer<typeof agentRunStepSchema>;

/** Agent run entity DTO with current status and stored output (Req 7.9). */
export const agentRunSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  roomId: idSchema,
  agentId: idSchema,
  requestedBy: idSchema,
  sourceMessageId: idSchema.nullable(),
  status: AgentRunStatus,
  taskType: z.string(),
  input: metadataSchema.nullable(),
  output: z.string().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: isoTimestampSchema.nullable(),
  completedAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  steps: z.array(agentRunStepSchema).optional(),
});
export type AgentRun = z.infer<typeof agentRunSchema>;

/** Acknowledgment returned when a run is enqueued (Req 7.1). */
export const agentRunAckSchema = z.object({
  id: idSchema,
  status: AgentRunStatus,
});
export type AgentRunAck = z.infer<typeof agentRunAckSchema>;
