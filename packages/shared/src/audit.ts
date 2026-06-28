import { z } from "zod";
import { ActorType } from "./enums";
import { idSchema, isoTimestampSchema, metadataSchema } from "./common";

/**
 * Shared audit port and constants.
 *
 * This defines the `AuditService` PORT interface plus the canonical audit
 * action names so domain call sites can record audit entries before the
 * concrete writer exists (implemented in task 20.1). The entry shape is
 * consistent with Req 12.2: actor id, actor type, action, target type/id,
 * metadata, and a timestamp.
 */

/**
 * Canonical audit action names for the sensitive actions enumerated in
 * Req 12.1. Use these constants at call sites instead of bare strings.
 */
export const AuditActions = {
  WORKSPACE_CREATE: "workspace.create",
  MEMBER_INVITE: "member.invite",
  MEMBER_ROLE_CHANGE: "member.role_change",
  GITHUB_CONNECT: "github.connect",
  REPO_CONNECT: "repo.connect",
  AGENT_RUN_CREATE: "agent_run.create",
  AGENT_FILE_READ: "agent.file_read",
} as const;

/** Union of the canonical audit action names. */
export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

/**
 * Full audit log entry as persisted/returned (Req 12.2).
 */
export const auditLogEntrySchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  actorType: ActorType,
  /** Actor id; null for system-originated actions. */
  actorId: idSchema.nullable(),
  action: z.string().min(1),
  targetType: z.string().min(1),
  /** Target id; null when the action has no concrete target id. */
  targetId: idSchema.nullable(),
  metadata: metadataSchema.nullable(),
  /** ISO 8601 UTC timestamp of the action. */
  timestamp: isoTimestampSchema,
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

/**
 * Input accepted by {@link AuditService.record}. The timestamp and id are
 * assigned by the writer, so call sites only provide the action context.
 */
export interface RecordAuditEntryInput {
  workspaceId: string;
  actorType: z.infer<typeof ActorType>;
  /** Actor id; null/undefined for system-originated actions. */
  actorId?: string | null;
  action: AuditAction | string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * PORT interface for recording audit entries.
 *
 * Implementations are best-effort and asynchronous: recording must never roll
 * back the originating action (Req 12.6). The concrete writer is implemented in
 * task 20.1; until then, call sites depend only on this port.
 */
export interface AuditService {
  /** Record a single audit entry for a sensitive action. */
  record(entry: RecordAuditEntryInput): Promise<void>;
}
