import { z } from "zod";

/**
 * Shared field-level schemas and bounds reused across DTOs.
 *
 * Field bounds are defined here exactly once so every consumer (api, worker,
 * web) validates against identical constraints. Bounds trace to the design's
 * Data Models and the requirements' acceptance criteria.
 */

// --- Field bounds (exported for reuse / documentation) ---
export const EMAIL_MIN = 1;
export const EMAIL_MAX = 254; // Req 3.1 / Req 1
export const PASSWORD_MIN = 8; // Req 1.1
export const PASSWORD_MAX = 128; // Req 1.1
export const WORKSPACE_NAME_MIN = 1; // Req 2.1
export const WORKSPACE_NAME_MAX = 100; // Req 2.1
export const ROOM_NAME_MIN = 1; // Req 4.1
export const ROOM_NAME_MAX = 100; // Req 4.1
export const ROOM_DESCRIPTION_MIN = 0; // Req 4.4
export const ROOM_DESCRIPTION_MAX = 500; // Req 4.4
export const MESSAGE_CONTENT_MIN = 1; // Req 5.1
export const MESSAGE_CONTENT_MAX = 4000; // Req 5.1
export const DISPLAY_NAME_MIN = 1;
export const DISPLAY_NAME_MAX = 100;

/** Generic identifier (UUID in practice, kept permissive for tokens/external ids). */
export const idSchema = z.string().min(1);

/** UUID identifier, used where the value is always a generated UUID. */
export const uuidSchema = z.uuid();

/** ISO 8601 / RFC 3339 timestamp string (UTC). */
export const isoTimestampSchema = z.iso.datetime({ offset: true });

/** Email address: 1-254 chars, standard email format (Req 1.2, 3.1, 3.2). */
export const emailSchema = z.email().min(EMAIL_MIN).max(EMAIL_MAX);

/** Account password: 8-128 chars (Req 1.1, 1.2). */
export const passwordSchema = z.string().min(PASSWORD_MIN).max(PASSWORD_MAX);

/** Human display name. */
export const displayNameSchema = z
  .string()
  .min(DISPLAY_NAME_MIN)
  .max(DISPLAY_NAME_MAX);

/**
 * Workspace name: 1-100 chars and not whitespace-only (Req 2.1, 2.2).
 */
export const workspaceNameSchema = z
  .string()
  .min(WORKSPACE_NAME_MIN)
  .max(WORKSPACE_NAME_MAX)
  .refine((value) => value.trim().length > 0, {
    message: "Workspace name must not be only whitespace",
  });

/** Room name: 1-100 chars (Req 4.1, 4.2). */
export const roomNameSchema = z
  .string()
  .min(ROOM_NAME_MIN)
  .max(ROOM_NAME_MAX)
  .refine((value) => value.trim().length > 0, {
    message: "Room name must not be only whitespace",
  });

/** Room description: 0-500 chars (Req 4.4, 4.6). */
export const roomDescriptionSchema = z.string().max(ROOM_DESCRIPTION_MAX);

/** Message content: 1-4000 chars (Req 5.1, 5.10). */
export const messageContentSchema = z
  .string()
  .min(MESSAGE_CONTENT_MIN)
  .max(MESSAGE_CONTENT_MAX);

/** Optional URL field (e.g. avatars). */
export const optionalUrlSchema = z.url().nullable().optional();

/** Free-form JSON metadata object. */
export const metadataSchema = z.record(z.string(), z.unknown());
