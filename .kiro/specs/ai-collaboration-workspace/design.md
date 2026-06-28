# Design Document

## Overview

The AI Collaboration Workspace is a team chat platform where AI coding agents are
first-class participants. Software teams create workspaces, join rooms, connect GitHub
repositories, chat in realtime, and collaborate with AI agents that can read repository
context and run controlled background tasks.

This document describes the technical design for MVP Version 1. It covers the modular
monolith architecture, the service modules, the realtime layer, the background agent
runner, GitHub integration, the data model, the API and WebSocket contracts, and the
cross-cutting concerns of security, error handling, and testing.

### Scope

In scope (mapped to requirements 1-14):

- Email and GitHub authentication with sessions (Req 1)
- Workspaces and workspace switching (Req 2)
- Member invitations and role management (Req 3)
- Rooms and room membership (Req 4)
- Realtime chat with markdown, edit, delete, mentions, history (Req 5)
- AI agent mention and response (Req 6)
- Background agent task queue and run status (Req 7)
- GitHub App installation (Req 8)
- Connecting repositories to rooms (Req 9)
- GitHub webhook event display (Req 10)
- Read-only repository context for agents (Req 11)
- Audit logs (Req 12)
- Notification center (Req 13)
- Access control and performance (Req 14)

Out of scope (Version 2): agent code editing, branch/commit/PR creation, billing,
enterprise SSO, mobile native apps, advanced analytics, agent marketplace.

### Design Goals

- Modular monolith first. One deployable API, one deployable worker, one frontend.
  Split into services only if the agent runner or realtime layer becomes too heavy.
- Stateless API so it can scale horizontally behind a load balancer.
- Realtime delivered over WebSocket, fanned out across instances through a Redis adapter.
- Long-running agent work isolated in a background worker fed by a durable queue.
- GitHub credentials never reach the browser. Installation tokens stay server-side.
- Agents operate read-only against repositories in the MVP.

### Relationship to the Existing Repository

The existing `web/` directory is a UI-first Next.js demo (gray-ui-csm) that renders
feature views from mock data with no backend. This feature introduces the backend
services and a realtime data layer the demo currently lacks. The design keeps the
frontend and backend cleanly separated so the existing UI patterns (thin routes,
feature components in `components/<feature>`, domain types and view-model helpers in
`lib/<feature>`) continue to apply: the frontend consumes typed API clients and a
WebSocket client instead of importing mock data directly. New backend code lives in
separate workspace apps and is not mixed into feature view components.

## Architecture

### High-Level Architecture

```txt
                         ┌──────────────────────────────┐
                         │           Browser             │
                         │  Next.js App (App Router)     │
                         │  REST client + WS client      │
                         └───────────────┬───────────────┘
                                         │ HTTPS / WSS
                                         ▼
                  ┌──────────────────────────────────────────┐
                  │              API (NestJS)                 │
                  │  REST controllers + WebSocket gateway     │
                  │  Auth guards, RBAC, validation            │
                  │  Domain modules (workspaces, rooms, ...)  │
                  └───┬───────────────┬──────────────┬────────┘
                      │               │              │
        enqueue jobs  │     pub/sub   │    read/write│
                      ▼               ▼              ▼
              ┌───────────────┐ ┌───────────┐ ┌──────────────┐
              │ Redis (queue  │ │  Redis    │ │  Postgres    │
              │ + BullMQ)     │ │  pub/sub  │ │  (Prisma)    │
              └───────┬───────┘ └─────┬─────┘ └──────────────┘
                      │               │
            consume   │               │ fan-out WS events
                      ▼               │
              ┌──────────────────────────────────────┐
              │            Worker (NestJS)            │
              │  Agent runner, GitHub webhook jobs    │
              │  LLM calls, repo context reads        │
              └───┬───────────────────────┬───────────┘
                  │                        │
                  ▼                        ▼
        ┌──────────────────┐     ┌────────────────────┐
        │  LLM Provider     │     │  GitHub (App API,  │
        │  (OpenAI-compat)  │     │  Octokit, webhooks)│
        └──────────────────┘     └────────────────────┘
```

### Monorepo Layout

The PRD recommends a monorepo. The MVP adds backend apps and shared packages alongside
the existing frontend.

```txt
apps/
  web/        Next.js frontend (existing web/ app, consumes API + WS)
  api/        NestJS REST API + WebSocket gateway (stateless)
  worker/     BullMQ workers: agent runner + GitHub webhook processor
packages/
  database/   Prisma schema, generated client, migrations
  shared/     Shared TypeScript types, DTOs, Zod schemas, constants
  agent-core/ Agent prompts, tool definitions, run state machine
  github-core/ GitHub App auth, Octokit helpers, webhook event mapping
```

The API and worker share the `database`, `shared`, `agent-core`, and `github-core`
packages so domain types and validation are defined once.

### Technology Stack

| Concern | Choice | Rationale |
| --- | --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui | Matches existing repo and PRD |
| API | NestJS, REST, WebSocket gateway | Module structure maps to domain services |
| Validation | Zod (shared) + Nest pipes | One schema source for client and server |
| Database | Postgres (Neon), Prisma | Relational data, migrations, type-safe client |
| Realtime | WebSocket (socket.io) + Redis adapter | Multi-instance fan-out |
| Queue | BullMQ on Redis | Durable jobs, retries, cancellation |
| AI | OpenAI-compatible provider via agent-core | Pluggable model provider |
| GitHub | GitHub App + Octokit + webhooks | Scoped install tokens, no user PATs |
| Auth | Session cookies (httpOnly) + GitHub OAuth | Secure session handling |
| Object storage | S3-compatible (R2) | Attachments (post-MVP wiring) |

### Request and Realtime Flow

- REST handles all create/read/update/delete operations and returns the authoritative
  result. Mutations that have realtime side effects publish an event after the database
  transaction commits.
- The WebSocket gateway handles room subscription and delivers server-to-client events.
  Clients send messages over REST (or a WS command that the gateway forwards to the same
  service), and receive the broadcast over WS. This keeps a single write path and avoids
  divergent validation.
- The worker never talks to clients directly. It publishes events to Redis pub/sub; the
  API instances subscribed to those channels fan them out to connected WebSocket clients.

## Components and Interfaces

Each backend module is a NestJS module with a controller (HTTP), a service (domain
logic), and a Prisma-backed repository boundary. Modules map directly to the requirement
glossary terms.

### AuthModule (Req 1)

Responsibilities: sign-up, sign-in, GitHub OAuth, session issue/terminate, guards.

- `POST /api/auth/signup` — validate email format and password length (8-128), reject
  duplicates, hash password (argon2/bcrypt), create user + profile, issue session.
- `POST /api/auth/login` — verify credentials, issue session. Generic error on failure
  (does not disclose which field was wrong) (Req 1.5).
- `POST /api/auth/logout` — terminate session.
- `GET /api/auth/me` — return current user profile.
- `GET /api/auth/github/callback` — exchange OAuth code, link or create user, issue
  session; on denial return an authorization-not-completed error (Req 1.7).
- Guards: `AuthGuard` rejects unauthenticated access to protected routes (Req 1.10).

Sessions are stored server-side (Redis-backed session store) and referenced by an
httpOnly, secure, SameSite cookie. JWT access tokens are an acceptable alternative; the
key constraint is that GitHub credentials are never exposed (Req 8.5).

### WorkspacesModule (Req 2)

- `GET /api/workspaces` — only workspaces where the user has active membership (Req 2.6).
- `POST /api/workspaces` — validate name (1-100, non-whitespace), create workspace,
  assign creator the Owner role, generate a globally unique slug (Req 2.1-2.3).
- `PATCH /api/workspaces/:workspaceId` — Owner/Admin only; update name/avatar (Req 2.4-2.5).
- Active workspace context is a client concern resolved per request via the
  `:workspaceId` path parameter; the API authorizes membership on every workspace-scoped
  route (Req 2.7-2.8, Req 14.1-14.2).

Slug generation: slugify the name, append a short random suffix on collision, retry
until unique within a transaction.

### MembersModule / Membership_Service (Req 3)

- `GET /api/workspaces/:workspaceId/members` — list members (workspace members only).
- `POST /api/workspaces/:workspaceId/invitations` — Owner/Admin only; validate email
  (1-254, standard format), reject duplicates of active/pending members, create a
  `workspace_member` row with `pending` status and a 7-day (168h) expiry (Req 3.1-3.4).
- `POST /api/invitations/:token/accept` — accept if pending and not expired; set status
  active and assign role (Req 3.5-3.6).
- `PATCH /api/workspaces/:workspaceId/members/:memberId` — Owner/Admin update role;
  reject if it would leave zero Owners (Req 3.7-3.8).
- `DELETE /api/workspaces/:workspaceId/members/:memberId` — Owner/Admin remove; reject if
  it would leave zero Owners; set status `removed` and revoke access (Req 3.9, 3.11).
- Member/Guest attempts to manage members are rejected (Req 3.10).

### RoomsModule / Room_Service (Req 4, 9, 10)

- `GET /api/workspaces/:workspaceId/rooms` — rooms visible to the user.
- `POST /api/workspaces/:workspaceId/rooms` — validate name (1-100), add creator as room
  member, assign exactly one room type (Req 4.1-4.3).
- `PATCH .../rooms/:roomId` — room members with Owner/Admin/Member role update name
  (1-100) and description (0-500); reject invalid input or unauthorized callers
  (Req 4.4-4.6).
- `POST .../rooms/:roomId/join` — join a non-archived room; reject archived (Req 4.7-4.8).
- `POST .../rooms/:roomId/leave` — leave room (Req 4.9).
- `POST .../rooms/:roomId/archive` — set read-only; archived rooms reject new messages
  (Req 4.11-4.12, Req 5.11).
- `POST .../rooms/:roomId/repository` — link a Connected_Repository; surfaces repo
  metadata in the room (Req 9.4, Req 4.13).
- `POST .../rooms/:roomId/agents` — assign an agent to the room (PRD ROOM-007).
- Non-members are denied access to room resources and messages (Req 4.10, Req 14.2).

### MessagesModule / Messaging_Service (Req 5)

- `GET .../rooms/:roomId/messages?cursor=` — reverse-chronological, page size 50,
  cursor-based pagination (Req 5.7).
- `POST .../rooms/:roomId/messages` — validate length (1-4000), store text or markdown
  content type, extract and persist `@user` and `@agent` mentions, reject empty/oversize
  and archived-room sends (Req 5.1-5.2, 5.8, 5.10-5.11).
- `PATCH .../messages/:messageId` — author-only edit; mark edited (Req 5.4-5.5).
- `DELETE .../messages/:messageId` — author-only soft delete (`deleted_at`) (Req 5.5-5.6).

Message types: `text`, `markdown`, `system`, `agent`, `github_event`, `agent_run`.
Sender is identified by `sender_type` (`user` | `agent` | `system`).

After commit, the service publishes `message:created` / `:updated` / `:deleted` to the
room channel for realtime fan-out (Req 5.3).

### AgentsModule + AgentRunsModule / Agent_Service (Req 6, 7)

Agent_Service owns the agent run lifecycle from the API side; Agent_Runner (worker) owns
execution.

- `GET /api/workspaces/:workspaceId/agents` — list available agents.
- `POST .../rooms/:roomId/agent-runs` — created when a user mentions an assigned agent or
  calls the endpoint directly. Validates the agent is assigned to the room (Req 6.5),
  creates exactly one `agent_run` with status `pending`, records `source_message_id`,
  enqueues a BullMQ job, and acknowledges within 1s (Req 6.1, 7.1, 14.5).
- `GET .../rooms/:roomId/agent-runs` and `GET .../agent-runs/:agentRunId` — current
  status, steps, and stored output (Req 7.9).
- `POST .../agent-runs/:agentRunId/cancel` — creator-only; allowed only while pending or
  running; rejects non-creators and terminal-state cancels (Req 7.6-7.8).

On run creation the service publishes `agent:run:created` (Req 6.2). Status transitions
published by the worker reach clients via Redis pub/sub (Req 6.4, 7.10).

### Agent_Runner (worker, Req 6, 7, 11)

A BullMQ consumer that processes one `agent_run` job at a time per concurrency slot:

1. Mark run `running`, publish `agent:run:started` (Req 7.2).
2. Load room context (recent messages) constrained to what the requesting user can access
   (Req 6.6), plus optional repository context via Repository_Context_Reader (Req 11).
3. Call the LLM provider (streaming). Append `agent_run_step` rows (capped at 500) for
   progress (Req 7.3); publish `agent:run:step` events.
4. On success: store output (capped at 1,000,000 chars), set status `completed`, post an
   `agent` message labeled AI-generated, publish `agent:run:completed` (Req 6.3, 7.4).
5. On failure: set status `failed`, store error reason, publish `agent:run:failed`, do
   not post a response message (Req 6.7, 7.5).
6. Enforce a 120s hard timeout; on breach terminate, set `failed`, notify room
   (Req 6.8). Cancellation is observed cooperatively via a Redis cancel flag and BullMQ
   job removal (Req 7.6).

The worker checks a per-run cancel flag between steps so a cancel request stops further
processing promptly.

### GithubModule / GitHub_Service + Webhook_Processor (Req 8, 9, 10)

GitHub_Service (API):

- `GET .../github/installations` and install initiation (Owner/Admin) (Req 8.1, 8.6).
- `GET .../github/setup/callback` — persist installation metadata, mark `active`; on
  failure discard partial metadata (Req 8.2-8.3).
- `GET .../github/repositories` — repos accessible to the installation + connected list
  (Req 9.3).
- `POST .../github/repositories/connect` — Owner/Admin; verify accessibility, reject
  duplicates, store Connected_Repository metadata (Req 9.1-9.2, 9.5-9.7).
- Credentials (installation tokens, private key) are stored server-side and never
  serialized into responses (Req 8.5).

Webhook_Processor (worker): `POST /api/github/webhooks` is received by the API, which
verifies the HMAC signature (Req 10.1-10.2), then enqueues the verified payload for the
worker. The worker:

- Discards events for non-connected repositories (Req 10.3).
- Deduplicates by GitHub delivery id (idempotent) (Req 10.8).
- Stores the `github_event`, posts a `github_event` message into each linked room
  (Req 10.4-10.5), retains but does not post events for unlinked repos (Req 10.6).
- Triggers PR opened/merged notifications (Req 13.4).

### Repository_Context_Reader (agent-core + github-core, Req 11)

A read-only tool surface used only by the Agent_Runner:

- `listFiles(repoId, path)` — up to 1,000 entries (Req 11.2).
- `searchCode(repoId, query)` — up to 100 matches (Req 11.3).
- `readFile(repoId, path)` — files up to 5 MB; rejects missing/oversize (Req 11.4, 11.9).
- All operations scoped to repositories connected to the agent's workspace (Req 11.1,
  11.8); any write/branch/commit/PR operation is rejected (Req 11.5-11.6); repository
  unavailability returns an error (Req 11.10).
- Every file read emits an Audit_Log_Entry with agent id, repo id, path, timestamp
  (Req 11.7, 12.1).

### NotificationsModule / Notification_Service (Req 13)

- Creates notifications within 5s for mentions (excluding self-mentions), agent
  completion/failure (to the requester), workspace invites, and PR opened/merged (to room
  members except the trigger user) (Req 13.1-13.5).
- `GET /api/notifications` — caller's own notifications, newest-first, page size 50;
  rejects cross-user access (Req 13.6-13.7).
- `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/read-all` — owner-only;
  rejects unknown/non-owned ids (Req 13.8-13.9).

### AuditLogsModule / Audit_Service (Req 12)

- Records one entry per sensitive action within 5s (Req 12.1) with actor id, actor type
  (`user` | `agent`), action, target id, ISO 8601 UTC timestamp, metadata (Req 12.2-12.3).
- `GET /api/workspaces/:workspaceId/audit-logs` — Owner/Admin only, newest-first, page
  size 100; Member/Guest denied (Req 12.4-12.5).
- Recording retries up to 3 times; persistent failure surfaces an error without rolling
  back the originating action (Req 12.6). Implemented as an async, best-effort writer that
  the originating transaction does not depend on.

### RealtimeModule / Realtime_Service (Req 5, 6, 7, 10)

- socket.io gateway with the Redis adapter for cross-instance broadcast.
- On connect, authenticate via the session cookie; reject unauthenticated sockets.
- `room:join` verifies room membership before subscribing the socket to the room channel
  (Req 14.2); supports rejoin after reconnect (Req 5.9).
- Subscribes to Redis pub/sub channels published by API and worker and relays events to
  the matching room's sockets.

## Data Models

Prisma schema (conceptual) in `packages/database`. Identifiers are UUIDs; timestamps are
`timestamptz`. Soft deletes use `deleted_at`.

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?  // null for GitHub-only accounts
  name         String
  avatarUrl    String?
  githubUserId String?  @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Workspace {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  avatarUrl String?
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum WorkspaceRole { OWNER ADMIN MEMBER GUEST }
enum MemberStatus  { PENDING ACTIVE REMOVED }

model WorkspaceMember {
  id           String        @id @default(uuid())
  workspaceId  String
  userId       String?       // null until a pending invite is accepted
  invitedEmail String?
  role         WorkspaceRole
  status       MemberStatus
  inviteToken  String?       @unique
  inviteExpiresAt DateTime?
  joinedAt     DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  @@unique([workspaceId, userId])
  @@index([workspaceId, status])
}

enum RoomType   { GENERAL REPOSITORY PULL_REQUEST AGENT_TASK }
enum RoomStatus { ACTIVE ARCHIVED }

model Room {
  id                  String     @id @default(uuid())
  workspaceId         String
  githubRepositoryId  String?
  name                String
  slug                String
  description         String?
  type                RoomType
  status              RoomStatus @default(ACTIVE)
  createdBy           String
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  @@unique([workspaceId, slug])
  @@index([workspaceId, status])
}

model RoomMember {
  id        String   @id @default(uuid())
  roomId    String
  userId    String
  role      WorkspaceRole
  joinedAt  DateTime @default(now())
  @@unique([roomId, userId])
}

model RoomAgent {
  id      String @id @default(uuid())
  roomId  String
  agentId String
  @@unique([roomId, agentId])
}

enum SenderType  { USER AGENT SYSTEM }
enum ContentType { TEXT MARKDOWN SYSTEM AGENT GITHUB_EVENT AGENT_RUN }

model Message {
  id            String      @id @default(uuid())
  workspaceId   String
  roomId        String
  senderType    SenderType
  senderUserId  String?
  senderAgentId String?
  content       String      // <= 4000 chars for user messages
  contentType   ContentType
  metadata      Json?
  editedAt      DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?
  @@index([roomId, createdAt])
}

model MessageMention {
  id            String @id @default(uuid())
  messageId     String
  mentionedType SenderType // USER or AGENT
  mentionedId   String
  @@index([messageId])
}

model Agent {
  id            String   @id @default(uuid())
  workspaceId   String
  name          String
  description   String?
  type          String
  status        String
  modelProvider String
  modelName     String
  systemPrompt  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum AgentRunStatus { PENDING RUNNING COMPLETED FAILED CANCELLED }

model AgentRun {
  id              String         @id @default(uuid())
  workspaceId     String
  roomId          String
  agentId         String
  requestedBy     String
  sourceMessageId String?
  status          AgentRunStatus @default(PENDING)
  taskType        String
  input           Json
  output          String?        // <= 1,000,000 chars
  errorMessage    String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  @@index([roomId, status])
}

model AgentRunStep {
  id         String   @id @default(uuid())
  agentRunId String
  sequence   Int
  label      String
  detail     Json?
  createdAt  DateTime @default(now())
  @@index([agentRunId, sequence]) // capped at 500 per run in service logic
}

enum InstallationStatus { ACTIVE REVOKED }

model GithubInstallation {
  id             String             @id @default(uuid())
  workspaceId    String
  installationId String             @unique
  accountLogin   String
  accountType    String
  status         InstallationStatus @default(ACTIVE)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model GithubRepository {
  id             String   @id @default(uuid())
  workspaceId    String
  installationId String
  githubRepoId   String
  owner          String
  name           String
  fullName       String
  private        Boolean
  defaultBranch  String
  htmlUrl        String
  status         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@unique([workspaceId, githubRepoId])
}

model GithubEvent {
  id           String   @id @default(uuid())
  workspaceId  String
  repositoryId String
  deliveryId   String   @unique // idempotency key
  eventType    String
  action       String?
  payload      Json
  createdAt    DateTime @default(now())
  @@index([repositoryId, createdAt])
}

enum NotificationType { MENTION AGENT_RUN INVITE GITHUB }

model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  body      String?
  link      String?
  metadata  Json?
  readAt    DateTime?
  createdAt DateTime         @default(now())
  @@index([userId, readAt, createdAt])
}

enum ActorType { USER AGENT SYSTEM }

model AuditLog {
  id          String    @id @default(uuid())
  workspaceId String
  actorType   ActorType
  actorUserId String?
  actorAgentId String?
  action      String
  targetType  String
  targetId    String?
  metadata    Json?
  createdAt   DateTime  @default(now())
  @@index([workspaceId, createdAt])
}
```

### Key Indexes and Constraints

- `Message(roomId, createdAt)` powers reverse-chronological pagination (Req 5.7, 14.6).
- `GithubEvent.deliveryId` unique enforces webhook idempotency (Req 10.8).
- `WorkspaceMember(workspaceId, userId)` unique prevents duplicate membership; a partial
  uniqueness on `(workspaceId, invitedEmail)` for pending invites prevents duplicate
  invites (Req 3.3).
- Owner-count guard (Req 3.8) is enforced in a transaction that counts active Owners
  before applying a role change or removal.

## API and Realtime Contracts

### REST Conventions

- JSON over HTTPS. Auth via httpOnly session cookie.
- Workspace-scoped routes are prefixed `/api/workspaces/:workspaceId/...` and authorize
  membership in a guard before the handler runs (Req 14.1).
- Validation via shared Zod schemas; invalid input returns `400` with a field-level error
  shape. Authorization failures return `403`; unauthenticated returns `401` (Req 1.10);
  not found returns `404`.
- List endpoints are cursor-paginated: `?cursor=<id>&limit=<n>` returning
  `{ items, nextCursor }`.

Representative endpoints are listed per module above and follow the PRD's API design
(sections 16.1-16.7).

### WebSocket Events

Client to server: `room:join`, `room:leave`, `message:typing:start`,
`message:typing:stop`, `agent:run:cancel`.

Server to client: `message:created`, `message:updated`, `message:deleted`,
`room:user:joined`, `room:user:left`, `room:typing`, `agent:run:created`,
`agent:run:started`, `agent:run:step`, `agent:run:completed`, `agent:run:failed`,
`github:event:created`, `notification:created`.

Each event payload carries `workspaceId`, `roomId` (when applicable), and the affected
entity. The gateway only emits to sockets that have joined the relevant room.

## Cross-Cutting Concerns

### Authorization Model

Two enforcement layers:

1. Workspace membership + role (Owner > Admin > Member > Guest) checked by a guard on all
   workspace-scoped routes (Req 14.1).
2. Room membership checked on all room-scoped routes and on `room:join` (Req 14.2).

Role capability matrix (MVP):

| Action | Owner | Admin | Member | Guest |
| --- | --- | --- | --- | --- |
| Update workspace, manage members, manage GitHub | yes | yes | no | no |
| View audit logs | yes | yes | no | no |
| Create/update rooms, send messages, run agents | yes | yes | yes | invited rooms only |
| Read invited room | yes | yes | yes | yes |

Agents act with the access scope of the requesting user and are read-only against repos
(Req 6.6, 11).

### Security

- Passwords hashed with argon2id (or bcrypt). Sessions in httpOnly, secure, SameSite
  cookies.
- GitHub App private key and installation tokens live only in server config/secret store;
  tokens are minted on demand and never serialized to clients (Req 8.5).
- Webhook HMAC verified with the GitHub webhook secret (Req 10.1).
- All workspace/room data access is authorization-checked server-side; the client never
  enforces access (Req 14.1-14.2).
- Agents cannot perform repository writes in the MVP (Req 11.5-11.6).
- Inbound payloads validated and size-limited (4000-char messages, 5 MB file reads).

### Performance

- Message send acknowledges within 500ms p95 at up to 100 concurrent users by writing a
  single indexed row and publishing asynchronously (Req 14.3, 14.5).
- Room initial load returns the 50 most recent messages via the
  `Message(roomId, createdAt)` index within 2s (Req 14.4, 14.6).
- Realtime fan-out target under 2s uses Redis pub/sub without per-event database reads
  (Req 5.3, 6.2, 7.10); GitHub event delivery target under 5s (Req 10.7).
- Stateless API enables horizontal scaling; the worker scales independently for agent
  load.

## Error Handling

- A global exception filter maps domain errors to consistent HTTP responses
  (`{ error: { code, message, fields? } }`). Authentication errors avoid disclosing which
  credential was wrong (Req 1.5).
- Input validation failures return `400` with field-level detail and persist nothing:
  invalid sign-up (Req 1.2), workspace name (Req 2.2), invitation email (Req 3.2), room
  name/description (Req 4.2, 4.6), and message length (Req 5.10).
- Authorization failures return `403` and leave state unchanged: workspace settings
  (Req 2.5), member management (Req 3.10), room updates (Req 4.5), message edit/delete
  (Req 5.5), GitHub management (Req 8.4, 9.6), agent-run cancel by non-creator (Req 7.7),
  audit log access (Req 12.5), and cross-user notification access (Req 13.7).
- Conflict and state-guard errors return `409`/`422` without mutation: duplicate email
  (Req 1.3), duplicate invite (Req 3.3), last-Owner guard (Req 3.8), invalid invite
  acceptance (Req 3.6), duplicate repository connect (Req 9.7), archived-room sends
  (Req 4.12, 5.11), and non-cancellable run state (Req 7.8).
- BullMQ jobs use bounded retries with backoff. Agent runs that exhaust retries or breach
  the 120s timeout are marked `failed` with a stored reason and an `agent:run:failed`
  event (Req 6.7-6.8, 7.5).
- Webhook signature failures are rejected before any persistence (Req 10.2); events for
  non-connected repositories are discarded (Req 10.3); duplicate deliveries are ignored
  via the unique delivery id (Req 10.8).
- Repository context errors return without content: not-connected (Req 11.8),
  missing/oversize file (Req 11.9), repository unavailable (Req 11.10), and rejected
  write operations (Req 11.6).
- Audit writes are best-effort with up to 3 retries and never roll back the originating
  action (Req 12.6).
- WebSocket clients reconnect with backoff and rejoin rooms; the server is stateless per
  socket beyond room subscription (Req 5.9).

## Correctness Properties

These invariants must hold regardless of execution path and are the basis for the
test suite below.

### Property 1: Authorization gating

Every workspace-scoped response is preceded by an active workspace membership check, and
every room-scoped response by an active room membership check. No path returns workspace
or room data to a non-member.

**Validates: Requirements 14.1, 14.2**

### Property 2: At least one Owner

A workspace always retains at least one active Owner. Role changes and removals that would
violate this are rejected atomically.

**Validates: Requirements 3.8**

### Property 3: Exactly-once agent run per mention

Mentioning an assigned agent creates exactly one `agent_run`; mentioning an unassigned
agent creates none.

**Validates: Requirements 6.1, 6.5**

### Property 4: Terminal-state monotonicity

An `agent_run` moves only pending -> running -> {completed | failed | cancelled}. Terminal
states never transition again, and cancel is rejected on terminal runs.

**Validates: Requirements 7.2, 7.4, 7.5, 7.6, 7.8**

### Property 5: Webhook idempotency

Processing the same GitHub delivery id more than once produces no additional stored event
and no duplicate room message.

**Validates: Requirements 10.8**

### Property 6: Read-only repository access

No agent code path can mutate a repository. All operations are list/search/read, and any
write/branch/commit/PR operation is rejected.

**Validates: Requirements 11.5, 11.6**

### Property 7: Ownership of mutation

Only the author may edit or delete a message, and only the creator may cancel an agent
run.

**Validates: Requirements 5.5, 7.7**

### Property 8: Notification ownership

A user only ever reads or mutates their own notifications, and self-mentions never create
notifications.

**Validates: Requirements 13.2, 13.7, 13.9**

### Property 9: Audit durability

A successful sensitive action results in exactly one audit entry, and an audit write
failure never reverses the originating action.

**Validates: Requirements 12.1, 12.6**

### Property 10: Soft-delete visibility

A deleted message is excluded from history and live delivery, but its row is retained.

**Validates: Requirements 5.6**

## Testing Strategy

- Unit tests for service-layer domain rules: input validation bounds, role checks,
  owner-count guard, slug uniqueness, mention extraction, invite expiry, run state
  transitions, webhook dedup, notification self-mention exclusion.
- Integration tests against a test Postgres (and Redis) for each module's endpoints,
  asserting status codes and persistence side effects, plus authorization matrices.
- Worker tests for the agent run lifecycle (pending -> running -> completed/failed/
  cancelled), 120s timeout, step capping, output capping, and read-only repo enforcement
  using a mocked GitHub client and a stubbed LLM provider.
- Realtime tests verifying membership-gated `room:join`, event fan-out across two API
  instances via the Redis adapter, and reconnect/rejoin.
- Contract tests for shared Zod DTOs so the frontend and backend stay aligned.
- Each acceptance criterion maps to at least one test; error-path criteria (IF/THEN) get
  explicit negative tests.

Note: the existing `web/` repo has no test framework configured. The backend apps will
introduce one (Jest is the NestJS default) under `apps/api` and `apps/worker`, with the
test command documented when added, per the repository testing guideline.

## Requirements Traceability

| Requirement | Primary components |
| --- | --- |
| 1 Authentication | AuthModule, RealtimeModule (socket auth) |
| 2 Workspaces | WorkspacesModule |
| 3 Members/Invitations | MembersModule |
| 4 Rooms | RoomsModule, MessagesModule |
| 5 Realtime chat | MessagesModule, RealtimeModule |
| 6 Agent mention/response | AgentsModule, Agent_Runner, RealtimeModule |
| 7 Agent queue/status | AgentRunsModule, Agent_Runner (BullMQ) |
| 8 GitHub App install | GithubModule |
| 9 Connect repository | GithubModule, RoomsModule |
| 10 Webhook events | API webhook endpoint, Webhook_Processor, RealtimeModule |
| 11 Repo context (read-only) | Repository_Context_Reader, github-core, AuditLogsModule |
| 12 Audit logs | AuditLogsModule |
| 13 Notifications | NotificationsModule |
| 14 Access control/performance | Auth/RBAC guards, indexes, Redis pub/sub |
