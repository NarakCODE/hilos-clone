import { z } from "zod";

/**
 * Cursor-based pagination primitives shared across all list endpoints.
 *
 * REST convention (see design.md "REST Conventions"): list endpoints accept
 * `?cursor=<id>&limit=<n>` and return `{ items, nextCursor }`, where
 * `nextCursor` is `null` when there are no further pages.
 */

/** Maximum page size any list endpoint may request. */
export const MAX_PAGE_LIMIT = 100;

/** Shared query schema for cursor-paginated list endpoints. */
export const paginationQuerySchema = z.object({
  /** Opaque cursor (typically the id of the last item from the prior page). */
  cursor: z.string().min(1).optional(),
  /** Requested page size; coerced from query strings, bounded to [1, 100]. */
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Wrap an item schema into the standard cursor-pagination response shape
 * `{ items: Item[], nextCursor: string | null }`.
 *
 * @example
 * const messagesPage = paginatedResponseSchema(messageSchema);
 * type MessagesPage = z.infer<typeof messagesPage>;
 */
export function paginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}

/** Generic TypeScript shape of a cursor-paginated response. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
