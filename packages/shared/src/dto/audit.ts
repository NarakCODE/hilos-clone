import { z } from "zod";
import { paginationQuerySchema } from "../pagination";

/**
 * Audit DTOs (Req 12): list query.
 *
 * The audit entry shape and the `AuditService` port live in `../audit`. This
 * module only adds the request-side DTO for listing entries.
 */

/**
 * `GET /api/workspaces/:workspaceId/audit-logs?cursor=&limit=` query (Req 12.4).
 * Entries are returned newest-first, in pages of at most 100.
 */
export const listAuditLogsQuerySchema = paginationQuerySchema;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
