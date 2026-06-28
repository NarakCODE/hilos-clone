import {
  MAX_PAGE_LIMIT,
  type Paginated,
  type PaginationQuery,
  paginationQuerySchema,
} from "@acw/shared";

/**
 * Reusable cursor-pagination helper for API list endpoints.
 *
 * REST convention (design.md "REST Conventions"): list endpoints accept
 * `?cursor=<id>&limit=<n>` and return the shared shape
 * `{ items, nextCursor }`, where `nextCursor` is `null` on the final page.
 *
 * The query schema and the `Paginated<T>` response shape are owned by
 * `@acw/shared` so the API and the web client validate/typecheck against one
 * definition; this module only adds the server-side mechanics.
 */

/** Default page size when a request omits `?limit=`. */
export const DEFAULT_PAGE_LIMIT = 50;

/** Re-exported for convenience at call sites. */
export { MAX_PAGE_LIMIT } from "@acw/shared";

export interface ResolvedPagination {
  /** Effective page size, clamped to `[1, MAX_PAGE_LIMIT]`. */
  limit: number;
  /** Opaque cursor from the request, or `undefined` for the first page. */
  cursor?: string;
  /**
   * Number of rows to fetch from the data source: `limit + 1`. Fetching one
   * extra row lets {@link buildPage} detect whether a further page exists
   * without a second count query.
   */
  take: number;
}

/**
 * Validate and normalize raw pagination query input (`{ cursor?, limit? }`)
 * into a {@link ResolvedPagination}. Invalid input (e.g. `limit=0` or a
 * non-numeric limit) throws via the shared schema and is surfaced as a 400 by
 * the validation layer.
 *
 * @param query Raw query object (typically `request.query`).
 * @param defaultLimit Page size to use when `limit` is omitted.
 */
export function resolvePagination(
  query: unknown,
  defaultLimit: number = DEFAULT_PAGE_LIMIT,
): ResolvedPagination {
  const parsed: PaginationQuery = paginationQuerySchema.parse(query ?? {});
  const limit = clampLimit(parsed.limit ?? defaultLimit);
  return {
    limit,
    cursor: parsed.cursor,
    take: limit + 1,
  };
}

/** Clamp a requested limit into the supported `[1, MAX_PAGE_LIMIT]` range. */
export function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_PAGE_LIMIT;
  }
  const truncated = Math.trunc(limit);
  if (truncated < 1) {
    return 1;
  }
  if (truncated > MAX_PAGE_LIMIT) {
    return MAX_PAGE_LIMIT;
  }
  return truncated;
}

/**
 * Build a `{ items, nextCursor }` page from rows fetched with
 * {@link ResolvedPagination.take} (i.e. `limit + 1`).
 *
 * If the data source returned more than `limit` rows, the extra row is
 * dropped and `nextCursor` is set to the cursor of the last returned item;
 * otherwise `nextCursor` is `null`.
 *
 * @param rows Rows fetched from the data source (length up to `limit + 1`).
 * @param limit The page size used for the request.
 * @param getCursor Extracts the opaque cursor (usually the id) from a row.
 */
export function buildPage<T>(
  rows: readonly T[],
  limit: number,
  getCursor: (row: T) => string,
): Paginated<T> {
  const safeLimit = clampLimit(limit);
  const hasMore = rows.length > safeLimit;
  const items = hasMore ? rows.slice(0, safeLimit) : rows.slice();
  const last = items.length > 0 ? items[items.length - 1] : undefined;
  const nextCursor = hasMore && last !== undefined ? getCursor(last) : null;
  return { items, nextCursor };
}
