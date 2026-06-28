import { z } from "zod";
import {
  idSchema,
  isoTimestampSchema,
  optionalUrlSchema,
  workspaceNameSchema,
} from "../common";
import { WorkspaceRole } from "../enums";

/**
 * Workspace DTOs (Req 2): create and update.
 */

/** `POST /api/workspaces` request body (Req 2.1, 2.2). */
export const createWorkspaceRequestSchema = z.object({
  name: workspaceNameSchema,
});
export type CreateWorkspaceRequest = z.infer<
  typeof createWorkspaceRequestSchema
>;

/**
 * `PATCH /api/workspaces/:workspaceId` request body (Req 2.4).
 * At least one updatable field should be provided by the caller.
 */
export const updateWorkspaceRequestSchema = z.object({
  name: workspaceNameSchema.optional(),
  avatarUrl: optionalUrlSchema,
});
export type UpdateWorkspaceRequest = z.infer<
  typeof updateWorkspaceRequestSchema
>;

/** Workspace entity DTO. */
export const workspaceSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  avatarUrl: optionalUrlSchema,
  createdBy: idSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});
export type Workspace = z.infer<typeof workspaceSchema>;

/**
 * Workspace as returned in a list for the current user, annotated with the
 * caller's role in that workspace (Req 2.6).
 */
export const workspaceSummarySchema = workspaceSchema.extend({
  role: WorkspaceRole,
});
export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;
