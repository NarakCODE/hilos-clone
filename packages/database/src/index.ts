// @acw/database
//
// Typed Prisma client for the AI Collaboration Workspace. Exposes a single
// shared `prisma` instance plus a re-export of the generated Prisma namespace,
// model types, and enums so apps/api and apps/worker depend on one client.
//
// The client reads its connection string from `DATABASE_URL` (see the schema's
// datasource and the repo `.env.example`). Run `pnpm --filter @acw/database
// db:generate` after changing the schema to regenerate the typed client.

import { PrismaClient } from "@prisma/client";

export const PACKAGE_NAME = "@acw/database";

/**
 * Options used to construct the shared {@link PrismaClient}. Logging is verbose
 * in development and quiet otherwise; callers can construct their own client
 * with {@link createPrismaClient} if they need different behavior.
 */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

// Reuse a single PrismaClient across hot-reloads / module re-evaluation in
// development to avoid exhausting database connections. In production a fresh
// instance is created once per process.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export the generated client surface (PrismaClient, the `Prisma` namespace
// with input/where types, generated model types, and all enums) so consumers
// import everything database-related from `@acw/database`.
export * from "@prisma/client";
export { PrismaClient } from "@prisma/client";
