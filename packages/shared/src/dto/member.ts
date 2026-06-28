import { z } from "zod";
import { emailSchema, idSchema, isoTimestampSchema } from "../common";
import { MemberStatus, WorkspaceRole } from "../enums";

/**
 * Member & invitation DTOs (Req 3): invite, accept, and role update.
 */

/** Roles that may be assigned to a member or invitation (Req 3.1, 3.7). */
export const assignableRoleSchema = WorkspaceRole;
export type AssignableRole = z.infer<typeof assignableRoleSchema>;

/** `POST /api/workspaces/:workspaceId/invitations` request body (Req 3.1, 3.2). */
export const inviteMemberRequestSchema = z.object({
  email: emailSchema,
  role: assignableRoleSchema,
});
export type InviteMemberRequest = z.infer<typeof inviteMemberRequestSchema>;

/** `POST /api/invitations/:token/accept` path params (Req 3.5, 3.6). */
export const acceptInvitationParamsSchema = z.object({
  token: z.string().min(1),
});
export type AcceptInvitationParams = z.infer<
  typeof acceptInvitationParamsSchema
>;

/**
 * `PATCH /api/workspaces/:workspaceId/members/:memberId` request body
 * (Req 3.7, 3.8).
 */
export const updateMemberRoleRequestSchema = z.object({
  role: assignableRoleSchema,
});
export type UpdateMemberRoleRequest = z.infer<
  typeof updateMemberRoleRequestSchema
>;

/** Workspace member entity DTO. */
export const memberSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  /** Null until a pending invitation is accepted. */
  userId: idSchema.nullable(),
  /** Email the invitation was sent to; null for directly-added members. */
  invitedEmail: emailSchema.nullable(),
  role: WorkspaceRole,
  status: MemberStatus,
  inviteExpiresAt: isoTimestampSchema.nullable(),
  joinedAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});
export type Member = z.infer<typeof memberSchema>;

/** Invitation view returned to an invited user before acceptance (Req 3.5). */
export const invitationSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  invitedEmail: emailSchema,
  role: WorkspaceRole,
  status: MemberStatus,
  expiresAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
});
export type Invitation = z.infer<typeof invitationSchema>;
