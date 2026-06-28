import { z } from "zod";
import { idSchema, isoTimestampSchema, metadataSchema } from "../common";
import { paginationQuerySchema } from "../pagination";
import { NotificationType } from "../enums";

/**
 * Notification DTOs (Req 13): list, read.
 */

/** `GET /api/notifications?cursor=&limit=` query (Req 13.6). */
export const listNotificationsQuerySchema = paginationQuerySchema;
export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;

/** `PATCH /api/notifications/:id/read` path params (Req 13.8, 13.9). */
export const markNotificationReadParamsSchema = z.object({
  id: idSchema,
});
export type MarkNotificationReadParams = z.infer<
  typeof markNotificationReadParamsSchema
>;

/** Notification entity DTO. */
export const notificationSchema = z.object({
  id: idSchema,
  userId: idSchema,
  type: NotificationType,
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  metadata: metadataSchema.nullable(),
  readAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
});
export type Notification = z.infer<typeof notificationSchema>;
