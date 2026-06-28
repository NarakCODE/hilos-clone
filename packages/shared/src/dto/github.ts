import { z } from "zod";
import { idSchema, isoTimestampSchema, metadataSchema } from "../common";
import { InstallationStatus } from "../enums";

/**
 * GitHub DTOs (Req 8, 9, 10): install, setup-callback, repo-connect, event.
 *
 * NOTE: installation tokens and the GitHub App private key are stored
 * server-side and are never represented in these client-facing DTOs (Req 8.5).
 */

/** `GET .../github/setup/callback` query params (Req 8.2, 8.3). */
export const githubSetupCallbackQuerySchema = z.object({
  installationId: z.string().min(1),
  setupAction: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
});
export type GithubSetupCallbackQuery = z.infer<
  typeof githubSetupCallbackQuerySchema
>;

/**
 * `POST .../github/repositories/connect` request body (Req 9.1, 9.2, 9.5-9.7).
 */
export const connectRepositoryRequestSchema = z.object({
  /** GitHub's numeric repository id (as a string), unique per workspace. */
  githubRepoId: z.string().min(1),
});
export type ConnectRepositoryRequest = z.infer<
  typeof connectRepositoryRequestSchema
>;

/** GitHub App installation entity DTO (no credentials) (Req 8.2, 8.6). */
export const githubInstallationSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  installationId: z.string(),
  accountLogin: z.string(),
  accountType: z.string(),
  status: InstallationStatus,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});
export type GithubInstallation = z.infer<typeof githubInstallationSchema>;

/**
 * Installation status view (Req 8.6): Active with account info, or Not
 * Installed when no installation exists for the workspace.
 */
export const githubInstallationStatusSchema = z.discriminatedUnion(
  "installed",
  [
    z.object({
      installed: z.literal(true),
      installation: githubInstallationSchema,
    }),
    z.object({
      installed: z.literal(false),
    }),
  ],
);
export type GithubInstallationStatus = z.infer<
  typeof githubInstallationStatusSchema
>;

/** Connected repository entity DTO (Req 9.2, 9.3). */
export const githubRepositorySchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  installationId: z.string(),
  githubRepoId: z.string(),
  owner: z.string(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  htmlUrl: z.string(),
  status: z.string(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});
export type GithubRepository = z.infer<typeof githubRepositorySchema>;

/** Stored GitHub webhook event entity DTO (Req 10.4, 10.8). */
export const githubEventSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  repositoryId: idSchema,
  /** GitHub delivery id; idempotency key (Req 10.8). */
  deliveryId: z.string(),
  eventType: z.string(),
  action: z.string().nullable(),
  payload: metadataSchema,
  createdAt: isoTimestampSchema,
});
export type GithubEvent = z.infer<typeof githubEventSchema>;
