# @acw/database

Prisma schema, generated client, and migrations for the AI Collaboration
Workspace. The API (`apps/api`) and worker (`apps/worker`) both import the typed
client from this package so the data model and client are defined once.

## Layout

```
packages/database/
  prisma/
    schema.prisma                 # source of truth for the data model
    migrations/
      migration_lock.toml         # records the provider (postgresql)
      20260628140009_init/
        migration.sql             # initial schema migration
  src/
    index.ts                      # exports the shared `prisma` client + types
```

## Connection

The datasource reads `DATABASE_URL` (PostgreSQL). See the repo-root
`.env.example`. For local CLI commands you can export it inline:

```
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/acw?schema=public"
```

## Scripts

Run with `pnpm --filter @acw/database <script>`:

- `db:generate` — regenerate the typed Prisma client (`prisma generate`).
- `db:migrate` — create/apply a migration against a live dev DB (`prisma migrate dev`).
- `db:deploy` — apply pending migrations in CI/production (`prisma migrate deploy`).
- `db:diff` — print the SQL diff from an empty database to the current schema.
- `db:format` / `db:validate` — format and validate `schema.prisma`.
- `build` / `typecheck` — compile `src` to `dist` via project references.

## Using the client

```ts
import { prisma, Prisma, WorkspaceRole } from "@acw/database"

const owners = await prisma.workspaceMember.findMany({
  where: { workspaceId, role: WorkspaceRole.OWNER, status: "ACTIVE" },
})
```

`src/index.ts` exposes a single shared `prisma` instance (reused across
hot-reloads in development) and re-exports the generated client surface
(`PrismaClient`, the `Prisma` namespace, model types, and all enums).

## Migrations

### How the initial migration was produced

A live PostgreSQL database was **not** available in this environment, so the
initial migration was generated from the schema rather than from a running
database:

```
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_init/migration.sql
```

This migration has **not** been applied to a live database yet. Apply it with
either of:

- `pnpm --filter @acw/database db:deploy` — applies all pending migrations
  (recommended for CI/production), or
- `pnpm --filter @acw/database db:migrate` — for local development against a
  dev database (will also reconcile migration history).

After cloning or changing the schema, run `pnpm --filter @acw/database
db:generate` to (re)generate the typed client.

### Partial unique index for pending invitations (Req 3.3)

The schema enforces `@@unique([workspaceId, userId])` on `WorkspaceMember` to
prevent duplicate membership for a known user. To also prevent duplicate
**pending** invitations for the same email within a workspace, a *partial*
unique index is required:

```sql
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_invitedEmail_pending_key"
    ON "WorkspaceMember" ("workspaceId", "invitedEmail")
    WHERE "status" = 'PENDING';
```

Prisma's schema language cannot express partial unique indexes, so this index
is appended as raw SQL at the end of the init migration
(`prisma/migrations/<timestamp>_init/migration.sql`). The `WHERE status =
'PENDING'` predicate means an email can be re-invited after a previous invite is
accepted or removed, and the index does not conflict with the
`(workspaceId, userId)` uniqueness used for active members.

> If you regenerate the migration from the schema, remember to re-append this
> raw partial unique index, since `prisma migrate diff` will not emit it.
