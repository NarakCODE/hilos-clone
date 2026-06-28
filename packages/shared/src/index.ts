// @acw/shared
//
// Shared TypeScript types, DTOs, Zod schemas, enums, and constants for the
// AI Collaboration Workspace. Schemas are defined once here and consumed by
// the frontend (apps/web), the API (apps/api), and the worker (apps/worker)
// for both runtime validation (Zod) and static typing (inferred types).

export const PACKAGE_NAME = "@acw/shared";

// Domain enums (mirror the Prisma schema in @acw/database).
export * from "./enums";

// Shared field schemas / bounds and primitive helpers.
export * from "./common";

// Cursor-pagination query schema and `{ items, nextCursor }` response helper.
export * from "./pagination";

// AuditService port, audit action constants, and audit entry shape.
export * from "./audit";

// Request/response DTOs grouped by domain.
export * from "./dto";
