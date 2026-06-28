import { z } from "zod";
import {
  displayNameSchema,
  emailSchema,
  idSchema,
  isoTimestampSchema,
  optionalUrlSchema,
  passwordSchema,
} from "../common";

/**
 * Auth DTOs (Req 1): signup, login, and current-user (me).
 */

/** `POST /api/auth/signup` request body (Req 1.1, 1.2). */
export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  /** Optional display name; defaults are derived server-side when omitted. */
  name: displayNameSchema.optional(),
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * `POST /api/auth/login` request body (Req 1.4, 1.5).
 *
 * Password is only required to be present here; credential correctness is
 * verified server-side with a generic, non-disclosing error on failure.
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * User profile returned by `GET /api/auth/me` and on successful auth
 * (Req 1.8).
 */
export const userProfileSchema = z.object({
  id: idSchema,
  email: emailSchema,
  name: displayNameSchema,
  avatarUrl: optionalUrlSchema,
  githubUserId: idSchema.nullable().optional(),
  createdAt: isoTimestampSchema,
});
export type UserProfile = z.infer<typeof userProfileSchema>;

/** Response shape for `GET /api/auth/me`. */
export const meResponseSchema = userProfileSchema;
export type MeResponse = z.infer<typeof meResponseSchema>;
