import { z } from "zod";
import {
  idSchema,
  isoTimestampSchema,
  messageContentSchema,
  metadataSchema,
} from "../common";
import { paginationQuerySchema } from "../pagination";
import { ContentType, SenderType } from "../enums";

/**
 * Message DTOs (Req 5): create, edit, list.
 */

/** Content types a user may submit directly (Req 5.1, 5.2). */
export const userContentTypeSchema = z.enum(["TEXT", "MARKDOWN"]);
export type UserContentType = z.infer<typeof userContentTypeSchema>;

/** `POST .../rooms/:roomId/messages` request body (Req 5.1, 5.2, 5.10). */
export const createMessageRequestSchema = z.object({
  content: messageContentSchema,
  /** Defaults to TEXT server-side when omitted. */
  contentType: userContentTypeSchema.optional(),
});
export type CreateMessageRequest = z.infer<typeof createMessageRequestSchema>;

/** `PATCH .../messages/:messageId` request body (Req 5.4). */
export const editMessageRequestSchema = z.object({
  content: messageContentSchema,
});
export type EditMessageRequest = z.infer<typeof editMessageRequestSchema>;

/** `GET .../rooms/:roomId/messages?cursor=&limit=` query (Req 5.7). */
export const listMessagesQuerySchema = paginationQuerySchema;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

/** A mention recorded on a message (Req 5.8). */
export const messageMentionSchema = z.object({
  id: idSchema,
  messageId: idSchema,
  /** USER or AGENT. */
  mentionedType: SenderType,
  mentionedId: idSchema,
});
export type MessageMention = z.infer<typeof messageMentionSchema>;

/** Message entity DTO. */
export const messageSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  roomId: idSchema,
  senderType: SenderType,
  senderUserId: idSchema.nullable(),
  senderAgentId: idSchema.nullable(),
  content: z.string(),
  contentType: ContentType,
  metadata: metadataSchema.nullable(),
  mentions: z.array(messageMentionSchema).optional(),
  editedAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  deletedAt: isoTimestampSchema.nullable(),
});
export type Message = z.infer<typeof messageSchema>;
