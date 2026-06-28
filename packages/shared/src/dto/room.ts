import { z } from "zod";
import {
  idSchema,
  isoTimestampSchema,
  roomDescriptionSchema,
  roomNameSchema,
} from "../common";
import { RoomStatus, RoomType, WorkspaceRole } from "../enums";

/**
 * Room DTOs (Req 4, 9): create, update, join, link-repo, assign-agent.
 */

/** `POST /api/workspaces/:workspaceId/rooms` request body (Req 4.1, 4.3). */
export const createRoomRequestSchema = z.object({
  name: roomNameSchema,
  /** Exactly one room type is assigned on creation (Req 4.3). */
  type: RoomType,
  description: roomDescriptionSchema.optional(),
});
export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>;

/** `PATCH .../rooms/:roomId` request body (Req 4.4, 4.6). */
export const updateRoomRequestSchema = z.object({
  name: roomNameSchema.optional(),
  description: roomDescriptionSchema.optional(),
});
export type UpdateRoomRequest = z.infer<typeof updateRoomRequestSchema>;

/** `POST .../rooms/:roomId/join` path params (Req 4.7, 4.8). */
export const joinRoomParamsSchema = z.object({
  roomId: idSchema,
});
export type JoinRoomParams = z.infer<typeof joinRoomParamsSchema>;

/** `POST .../rooms/:roomId/repository` request body (Req 4.13, 9.4). */
export const linkRepositoryRequestSchema = z.object({
  /** Id of a Connected_Repository within the workspace. */
  githubRepositoryId: idSchema,
});
export type LinkRepositoryRequest = z.infer<
  typeof linkRepositoryRequestSchema
>;

/** `POST .../rooms/:roomId/agents` request body (assign an agent to the room). */
export const assignAgentRequestSchema = z.object({
  agentId: idSchema,
});
export type AssignAgentRequest = z.infer<typeof assignAgentRequestSchema>;

/** Room entity DTO. */
export const roomSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  githubRepositoryId: idSchema.nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  type: RoomType,
  status: RoomStatus,
  createdBy: idSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});
export type Room = z.infer<typeof roomSchema>;

/** Room member entity DTO. */
export const roomMemberSchema = z.object({
  id: idSchema,
  roomId: idSchema,
  userId: idSchema,
  role: WorkspaceRole,
  joinedAt: isoTimestampSchema,
});
export type RoomMember = z.infer<typeof roomMemberSchema>;
