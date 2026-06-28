import { z } from "zod";

/**
 * Shared domain enums for the AI Collaboration Workspace.
 *
 * Each enum is declared as a Zod enum whose values match the Prisma schema in
 * `packages/database` exactly. The inferred TypeScript union type is exported
 * under the same identifier so call sites can use a single source of truth for
 * both runtime validation and static typing.
 *
 * Pattern: `const X = z.enum([...])` (runtime schema) and
 * `type X = z.infer<typeof X>` (the string-literal union). The value and type
 * live in separate namespaces, so sharing the identifier is intentional.
 */

/** Workspace membership role, ordered Owner > Admin > Member > Guest. */
export const WorkspaceRole = z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]);
export type WorkspaceRole = z.infer<typeof WorkspaceRole>;

/** Lifecycle status of a workspace membership / invitation. */
export const MemberStatus = z.enum(["PENDING", "ACTIVE", "REMOVED"]);
export type MemberStatus = z.infer<typeof MemberStatus>;

/** Room category; a room is assigned exactly one type. */
export const RoomType = z.enum([
  "GENERAL",
  "REPOSITORY",
  "PULL_REQUEST",
  "AGENT_TASK",
]);
export type RoomType = z.infer<typeof RoomType>;

/** Room status; archived rooms are read-only. */
export const RoomStatus = z.enum(["ACTIVE", "ARCHIVED"]);
export type RoomStatus = z.infer<typeof RoomStatus>;

/** Origin of a message. */
export const SenderType = z.enum(["USER", "AGENT", "SYSTEM"]);
export type SenderType = z.infer<typeof SenderType>;

/** Rendering / semantic type of a message body. */
export const ContentType = z.enum([
  "TEXT",
  "MARKDOWN",
  "SYSTEM",
  "AGENT",
  "GITHUB_EVENT",
  "AGENT_RUN",
]);
export type ContentType = z.infer<typeof ContentType>;

/** Lifecycle status of an agent run. */
export const AgentRunStatus = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

/** Category of a user notification. */
export const NotificationType = z.enum([
  "MENTION",
  "AGENT_RUN",
  "INVITE",
  "GITHUB",
]);
export type NotificationType = z.infer<typeof NotificationType>;

/** Actor type recorded on an audit log entry. */
export const ActorType = z.enum(["USER", "AGENT", "SYSTEM"]);
export type ActorType = z.infer<typeof ActorType>;

/** GitHub App installation status. */
export const InstallationStatus = z.enum(["ACTIVE", "REVOKED"]);
export type InstallationStatus = z.infer<typeof InstallationStatus>;
