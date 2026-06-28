import fc from "fast-check";
import { MAX_PAGE_LIMIT } from "@acw/shared";
import {
  buildPage,
  clampLimit,
  DEFAULT_PAGE_LIMIT,
  resolvePagination,
} from "./cursor-pagination";

interface Row {
  id: string;
}

const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));

describe("resolvePagination", () => {
  it("uses the default limit when none is provided", () => {
    const r = resolvePagination({});
    expect(r.limit).toBe(DEFAULT_PAGE_LIMIT);
    expect(r.take).toBe(DEFAULT_PAGE_LIMIT + 1);
    expect(r.cursor).toBeUndefined();
  });

  it("honors a custom default limit", () => {
    expect(resolvePagination({}, 100).limit).toBe(100);
  });

  it("parses and clamps the requested limit and passes the cursor through", () => {
    const r = resolvePagination({ cursor: "abc", limit: "25" });
    expect(r.cursor).toBe("abc");
    expect(r.limit).toBe(25);
    expect(r.take).toBe(26);
  });

  it("accepts the maximum allowed limit", () => {
    expect(resolvePagination({ limit: String(MAX_PAGE_LIMIT) }).limit).toBe(
      MAX_PAGE_LIMIT,
    );
  });

  it("rejects invalid limits via the shared schema (surfaced as 400)", () => {
    // The shared paginationQuerySchema bounds limit to [1, MAX_PAGE_LIMIT];
    // out-of-range / non-numeric values throw and are mapped to a 400.
    expect(() => resolvePagination({ limit: "0" })).toThrow();
    expect(() => resolvePagination({ limit: "-3" })).toThrow();
    expect(() => resolvePagination({ limit: "abc" })).toThrow();
    expect(() => resolvePagination({ limit: String(MAX_PAGE_LIMIT + 1) })).toThrow();
  });
});

describe("clampLimit", () => {
  it("bounds values into [1, MAX_PAGE_LIMIT]", () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(-10)).toBe(1);
    expect(clampLimit(MAX_PAGE_LIMIT + 1)).toBe(MAX_PAGE_LIMIT);
    expect(clampLimit(10)).toBe(10);
  });

  it("falls back to the default for non-finite input", () => {
    expect(clampLimit(Number.NaN)).toBe(DEFAULT_PAGE_LIMIT);
  });
});

describe("buildPage", () => {
  it("returns nextCursor=null when there is no further page", () => {
    const page = buildPage(rows(3), 5, (r) => r.id);
    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it("drops the sentinel row and sets nextCursor when more exist", () => {
    // Fetched limit + 1 (= 6) rows for a page size of 5.
    const page = buildPage(rows(6), 5, (r) => r.id);
    expect(page.items).toHaveLength(5);
    expect(page.items.at(-1)?.id).toBe("id-4");
    expect(page.nextCursor).toBe("id-4");
  });

  it("handles an empty result set", () => {
    const page = buildPage([], 5, (r: Row) => r.id);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  // --- Property-based tests (fast-check) ---

  it("property: never returns more items than the page limit", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_PAGE_LIMIT }),
        fc.nat({ max: 250 }),
        (limit, count) => {
          const page = buildPage(rows(count), limit, (r) => r.id);
          expect(page.items.length).toBeLessThanOrEqual(limit);
        },
      ),
    );
  });

  it("property: nextCursor is non-null iff a further page exists", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_PAGE_LIMIT }),
        fc.nat({ max: 250 }),
        (limit, count) => {
          const fetched = rows(count);
          const page = buildPage(fetched, limit, (r) => r.id);
          const hasMore = fetched.length > limit;
          if (hasMore) {
            expect(page.nextCursor).toBe(page.items.at(-1)?.id);
            expect(page.items.length).toBe(limit);
          } else {
            expect(page.nextCursor).toBeNull();
            expect(page.items.length).toBe(fetched.length);
          }
        },
      ),
    );
  });

  it("property: returned items are a prefix of the fetched rows", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_PAGE_LIMIT }),
        fc.nat({ max: 250 }),
        (limit, count) => {
          const fetched = rows(count);
          const page = buildPage(fetched, limit, (r) => r.id);
          page.items.forEach((item, i) => {
            expect(item.id).toBe(fetched[i]?.id);
          });
        },
      ),
    );
  });
});
