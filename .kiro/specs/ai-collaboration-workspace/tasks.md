# Implementation Plan: AI Collaboration Workspace

## Overview

This plan builds the AI Collaboration Workspace as a modular monolith in a pnpm
workspace alongside the existing `web/` Next.js demo. Work proceeds bottom-up and
test-driven: foundational monorepo + shared packages + Prisma schema + test harness
first, then authentication and sessions, then the domain modules layered in dependency
order (workspaces, members, rooms, messaging, realtime), then the agent runner and
GitHub integration, then notifications, audit logs, frontend wiring, and finally
cross-cutting access-control and performance hardening.

Implementation language is **TypeScript** throughout (NestJS for `apps/api` and
`apps/worker`, Next.js for `apps/web`), per the design. The existing `web/` app has no
test framework, so the backend apps introduce **Jest** (the NestJS default) plus
`fast-check` for property-based tests of the design's Correctness Properties. Backend
property and integration tests run against a test Postgres + Redis.

Each task references the requirements it implements; property-test tasks reference the
specific Correctness Property from the design. Frontend tasks follow `AGENTS.md` and
`web/PROJECT_RULES.md` (thin routes, feature components in `components/<feature>`,
domain helpers in `lib/<feature>`, semantic tokens) and run `pnpm check:guardrails`,
`pnpm lint`, `pnpm typecheck`, and `pnpm build`.

## Tasks

- [x] 1. Foundation: monorepo, shared packages, schema, and test harness
  - [x] 1.1 Establish pnpm workspace and app/package scaffolding
    - Add a root `pnpm-workspace.yaml` covering `apps/*` and `packages/*`; move the existing demo to `apps/web` (or register `web/` as `apps/web`) without changing its behavior
    - Create empty package shells for `apps/api`, `apps/worker`, `packages/database`, `packages/shared`, `packages/agent-core`, `packages/github-core` with `package.json`, `tsconfig`, and inter-package references
    - Add root scripts to build/lint/typecheck all workspaces and a `.env.example` documenting Postgres, Redis, session, GitHub App, and LLM provider config
    - _Requirements: 14.1, 14.3_

  - [x] 1.2 Define shared types, DTOs, and Zod schemas in `packages/shared`
    - Implement Zod schemas and inferred TypeScript types for auth, workspace, member/invitation, room, message, agent/agent-run, GitHub install/repo/event, notification, and audit DTOs, including all field bounds (email 1-254, password 8-128, workspace/room name 1-100, description 0-500, message 1-4000)
    - Define shared enums (roles, member status, room type/status, sender/content type, run status, notification/actor type) and the cursor-pagination response shape `{ items, nextCursor }`
    - Define a shared `AuditService` port interface and audit action constants so call sites can record audit entries before the concrete writer exists
    - _Requirements: 1.1, 1.2, 2.2, 3.1, 3.2, 4.2, 4.6, 5.10, 12.2_

  - [x] 1.3 Create Prisma schema, client, and initial migration in `packages/database`
    - Implement the full Prisma schema from the design (User, Workspace, WorkspaceMember, Room, RoomMember, RoomAgent, Message, MessageMention, Agent, AgentRun, AgentRunStep, GithubInstallation, GithubRepository, GithubEvent, Notification, AuditLog) with UUID ids, `timestamptz`, and `deleted_at` soft-delete columns
    - Add the design's indexes and constraints: `Message(roomId, createdAt)`, unique `GithubEvent.deliveryId`, unique `WorkspaceMember(workspaceId, userId)` + partial unique on pending `(workspaceId, invitedEmail)`, unique `Room(workspaceId, slug)`, `Workspace.slug` unique
    - Generate the client, wire a migration script, and export a typed Prisma client module reused by api and worker
    - _Requirements: 3.3, 5.6, 5.7, 10.8, 14.6_

  - [x] 1.4 Scaffold `apps/api` (NestJS) with test harness and cross-cutting infra
    - Bootstrap a NestJS app with a global exception filter mapping domain errors to `{ error: { code, message, fields? } }` (400 validation, 401 unauthenticated, 403 authorization, 404 not found, 409/422 conflict/state-guard)
    - Add a Zod-backed validation pipe wired to `packages/shared` schemas and a reusable cursor-pagination helper
    - Configure Jest with `fast-check`, a test Postgres/Redis setup, and document the `test` command in the app README
    - _Requirements: 1.10, 2.2, 3.2, 4.2, 4.6, 5.10_

  - [x] 1.5 Scaffold `apps/worker` (NestJS + BullMQ) with Redis and test harness
    - Bootstrap a worker app with BullMQ queue/connection config for the agent-run and webhook queues and a Redis pub/sub publisher used to emit realtime events
    - Add Jest test setup mirroring the api harness (test Redis + Postgres) and document the worker `test` command
    - _Requirements: 7.1_

- [ ] 2. Authentication and sessions
  - [ ] 2.1 Implement session store, password hashing, and AuthGuard
    - Implement argon2id password hashing, a Redis-backed server-side session store, and httpOnly/secure/SameSite session cookie issue/terminate helpers
    - Implement `AuthGuard` that rejects unauthenticated requests to protected routes with a 401 authentication-required response
    - _Requirements: 1.8, 1.10_

  - [ ] 2.2 Implement email auth endpoints
    - Implement `POST /api/auth/signup` (validate email/password bounds, reject duplicate email, hash password, create user + profile, issue session), `POST /api/auth/login` (verify credentials, generic non-disclosing error on failure), `POST /api/auth/logout` (terminate session), and `GET /api/auth/me`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 1.9_

  - [ ]* 2.3 Write unit tests for auth validation and session rules
    - Cover email/password bounds, duplicate-email rejection, generic login error wording, and logout session termination
    - _Requirements: 1.2, 1.3, 1.5, 1.9_

  - [ ] 2.4 Implement GitHub OAuth sign-in and account linking
    - Implement `GET /api/auth/github/callback` to exchange the OAuth code, link or create a user keyed by GitHub identity, issue a session, and return an authorization-not-completed error on denial/failure without creating a session
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ]* 2.5 Write integration tests for auth endpoints
    - Assert status codes, session cookie behavior, and persistence for signup/login/logout and OAuth callback success/denial paths
    - _Requirements: 1.1, 1.4, 1.6, 1.7, 1.10_

- [ ] 3. Checkpoint - authentication foundation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Workspaces and workspace-scoped authorization
  - [ ] 4.1 Implement WorkspacesModule with membership and role guards
    - Implement `GET /api/workspaces` (only workspaces with active membership), `POST /api/workspaces` (validate name 1-100 non-whitespace, create workspace, assign creator Owner, generate globally unique slug with collision-retry), and `PATCH /api/workspaces/:workspaceId` (Owner/Admin only; update name/avatar)
    - Implement `WorkspaceMembershipGuard` (active membership on every workspace-scoped route) and a `RolesGuard`/decorator enforcing the Owner > Admin > Member > Guest capability matrix; deny non-member workspace selection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 14.1, 14.2_

  - [ ]* 4.2 Write unit tests for workspace rules
    - Cover name validation, slug uniqueness/collision-retry, Owner assignment on create, and role-gated update rejection
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 4.3 Write integration tests for workspace authorization
    - Assert membership-filtered listing, non-member selection denial, and Member/Guest update 403s leaving settings unchanged
    - _Requirements: 2.5, 2.6, 2.8_

- [ ] 5. Members and invitations
  - [ ] 5.1 Implement MembersModule / Membership_Service
    - Implement list members, `POST .../invitations` (Owner/Admin; validate email 1-254, reject duplicate active/pending, create pending `workspace_member` with 168h expiry), `POST /api/invitations/:token/accept` (accept pending non-expired, set active, assign role), role update and member removal with the **atomic last-Owner guard**, and removal setting status `removed` revoking access
    - Reject Member/Guest attempts to invite, remove, or change roles with a permissions error
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 3.11_

  - [ ]* 5.2 Write property test for at-least-one-Owner invariant
    - **Property 2: At least one Owner**
    - **Validates: Requirements 3.8**

  - [ ]* 5.3 Write unit tests for invitation rules
    - Cover email validation, duplicate active/pending rejection, 168h expiry computation, and invalid-acceptance (expired/accepted/not-found) handling
    - _Requirements: 3.2, 3.3, 3.4, 3.6_

  - [ ]* 5.4 Write integration tests for member authorization matrix
    - Assert Owner/Admin allowed and Member/Guest denied for invite/role/remove, and acceptance state transitions
    - _Requirements: 3.5, 3.10, 3.11_

- [ ] 6. Rooms and room-scoped authorization
  - [ ] 6.1 Implement RoomsModule / Room_Service with RoomMembershipGuard
    - Implement room create (name 1-100, add creator as member, assign exactly one room type), update (members with Owner/Admin/Member role; name 1-100, description 0-500), join (non-archived only), leave, archive (set read-only), repository link endpoint, and agent assignment endpoint
    - Implement `RoomMembershipGuard` denying non-members access to room resources/messages; reject archived-room joins and unauthorized/invalid updates
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.13, 14.2_

  - [ ]* 6.2 Write unit tests for room rules
    - Cover name/description bounds, single-type assignment, archived-join rejection, and update authorization
    - _Requirements: 4.2, 4.3, 4.6, 4.8_

  - [ ]* 6.3 Write integration tests for room authorization
    - Assert non-member room access denial and role-gated update/archive behavior
    - _Requirements: 4.5, 4.10, 4.11_

- [ ] 7. Authorization gating verification
  - [ ]* 7.1 Write property test for workspace/room authorization gating
    - **Property 1: Authorization gating**
    - **Validates: Requirements 14.1, 14.2**

- [ ] 8. Checkpoint - core collaboration scaffolding
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Messaging
  - [ ] 9.1 Implement MessagesModule / Messaging_Service
    - Implement `GET .../messages?cursor=` (reverse-chronological, page size 50, excludes soft-deleted), `POST .../messages` (validate 1-4000, store text/markdown content type, extract & persist `@user`/`@agent` mentions, reject empty/oversize and archived-room sends), author-only `PATCH .../messages/:id` (mark edited), and author-only soft-delete `DELETE .../messages/:id` (`deleted_at`)
    - Publish `message:created`/`:updated`/`:deleted` to the room channel after commit for realtime fan-out; acknowledge sends with a single indexed write + async publish
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.10, 5.11, 14.5_

  - [ ]* 9.2 Write property test for soft-delete visibility
    - **Property 10: Soft-delete visibility**
    - **Validates: Requirements 5.6**

  - [ ]* 9.3 Write unit tests for messaging rules
    - Cover length validation, mention extraction, author-only edit/delete authorization, and archived-room send rejection
    - _Requirements: 5.5, 5.8, 5.10, 5.11_

  - [ ]* 9.4 Write integration tests for messaging
    - Assert pagination ordering/page size, edit marks edited, and persistence side effects
    - _Requirements: 5.1, 5.4, 5.7_

- [ ] 10. Realtime layer
  - [ ] 10.1 Implement RealtimeModule (socket.io gateway + Redis adapter)
    - Implement the socket.io gateway with the Redis adapter, authenticate sockets via the session cookie (reject unauthenticated), gate `room:join` on room membership, support rejoin after reconnect, and relay Redis pub/sub events (`message:*`, presence/typing) to the room's sockets within the latency targets
    - _Requirements: 5.3, 5.9, 14.2_

  - [ ]* 10.2 Write integration tests for realtime delivery
    - Assert membership-gated join, message fan-out across two API instances via the Redis adapter, and reconnect/rejoin resuming events
    - _Requirements: 5.3, 5.9, 14.2_

- [ ] 11. Checkpoint - realtime chat working end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Agents and agent runs (API side)
  - [ ] 12.1 Implement AgentsModule and AgentRunsModule / Agent_Service
    - Implement `GET .../agents` (list workspace agents), agent run creation from an assigned-agent mention or direct call that validates the agent is assigned to the room, creates **exactly one** `agent_run` (status `pending`, records `source_message_id`), enqueues a BullMQ job, and acknowledges within 1s; reject mentions of unassigned agents with no run created
    - Implement `GET .../agent-runs` / `GET .../agent-runs/:id` (current status, steps, stored output) and creator-only `POST .../agent-runs/:id/cancel` (allowed only while pending/running; reject non-creators and terminal-state cancels)
    - Publish `agent:run:created` after creation for realtime fan-out
    - _Requirements: 6.1, 6.2, 6.5, 7.1, 7.6, 7.7, 7.8, 7.9, 14.7_

  - [ ]* 12.2 Write property test for exactly-once agent run per mention
    - **Property 3: Exactly-once agent run per mention**
    - **Validates: Requirements 6.1, 6.5**

  - [ ]* 12.3 Write property test for ownership of mutation
    - **Property 7: Ownership of mutation** (message author-only edit/delete and run creator-only cancel)
    - **Validates: Requirements 5.5, 7.7**

  - [ ]* 12.4 Write unit tests for agent run state and authorization
    - Cover cancel authorization, non-cancellable terminal-state rejection, and single-run creation on mention
    - _Requirements: 6.5, 7.7, 7.8_

  - [ ]* 12.5 Write integration tests for agent run endpoints
    - Assert 1s acknowledgment shape, status/output retrieval, and `agent:run:created` emission
    - _Requirements: 7.1, 7.9, 6.2_

- [ ] 13. Agent runner (worker)
  - [ ] 13.1 Implement Agent_Runner BullMQ consumer with agent-core
    - Implement the run lifecycle (`pending` -> `running` -> `completed`/`failed`/`cancelled`): load user-scoped room context, call the LLM provider, append `agent_run_step` rows capped at 500, store output capped at 1,000,000 chars, post a single AI-labeled `agent` message on success, and on failure store an error reason and post no response message
    - Enforce a 120s hard timeout (terminate -> `failed`, notify room) and observe a per-run Redis cancel flag cooperatively between steps; publish `agent:run:started`/`:step`/`:completed`/`:failed` via Redis pub/sub
    - Define agent prompts, tool definitions, and the run state machine in `packages/agent-core`
    - _Requirements: 6.3, 6.4, 6.6, 6.7, 6.8, 7.2, 7.3, 7.4, 7.5, 7.6, 7.10_

  - [ ]* 13.2 Write property test for terminal-state monotonicity
    - **Property 4: Terminal-state monotonicity**
    - **Validates: Requirements 7.2, 7.4, 7.5, 7.6, 7.8**

  - [ ]* 13.3 Write worker tests for the run lifecycle
    - Cover timeout-to-failed, step capping (500), output capping (1,000,000), cancel-flag stopping, and no-message-on-failure using a stubbed LLM provider
    - _Requirements: 6.6, 6.7, 6.8, 7.3, 7.4, 7.5_

- [ ] 14. Checkpoint - agents running in the background
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. GitHub App installation
  - [ ] 15.1 Implement `packages/github-core`
    - Implement GitHub App authentication (private key, on-demand installation token minting kept server-side), Octokit helpers, and webhook event payload mapping
    - _Requirements: 8.5, 10.4_

  - [ ] 15.2 Implement GithubModule install flow
    - Implement Owner/Admin install initiation, `GET .../github/setup/callback` (persist installation metadata, mark `active`; discard partial metadata and error on failure/no installation id), and installation status display (Active with account login/type, or Not Installed); ensure credentials are never serialized into responses; deny Member/Guest management
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 15.3 Write unit tests for installation rules
    - Cover partial-metadata discard on failure, credential non-serialization, and role-gated management
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 15.4 Write integration tests for installation flow
    - Assert callback success marks Active and status display reflects installed/not-installed state
    - _Requirements: 8.2, 8.6_

- [ ] 16. Connect repository to room
  - [ ] 16.1 Implement repository connect and room linking
    - Implement `GET .../github/repositories` (installation-accessible + connected list), Owner/Admin `POST .../github/repositories/connect` (verify accessibility, reject inaccessible and duplicates, store Connected_Repository metadata), and Room_Service repository link surfacing repo metadata in the room
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 16.2 Write unit tests for repository connect rules
    - Cover inaccessible-repo rejection, duplicate-connect rejection, and role gating
    - _Requirements: 9.5, 9.6, 9.7_

  - [ ]* 16.3 Write integration tests for connect and room link
    - Assert metadata persistence, connected-list display, and room link visibility
    - _Requirements: 9.2, 9.3, 9.4_

- [ ] 17. GitHub webhook events
  - [ ] 17.1 Implement webhook endpoint and Webhook_Processor
    - Implement `POST /api/github/webhooks` HMAC signature verification (reject and persist nothing on failure) and enqueue verified payloads; in the worker, deduplicate by GitHub delivery id (idempotent), discard events for non-connected repositories, store the `github_event`, post a `github_event` message into each linked room (retain but do not post for unlinked repos), publish realtime delivery, and trigger PR opened/merged notifications
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 17.2 Write property test for webhook idempotency
    - **Property 5: Webhook idempotency**
    - **Validates: Requirements 10.8**

  - [ ]* 17.3 Write unit tests for webhook processing
    - Cover signature rejection (no persistence), non-connected discard, and unlinked-repo retain-without-post
    - _Requirements: 10.2, 10.3, 10.6_

  - [ ]* 17.4 Write integration tests for webhook-to-room flow
    - Assert verified events post to linked rooms and deliver in realtime
    - _Requirements: 10.4, 10.5, 10.7_

- [ ] 18. Read-only repository context for agents
  - [ ] 18.1 Implement Repository_Context_Reader
    - Implement `listFiles` (<=1,000 entries), `searchCode` (<=100 matches), and `readFile` (<=5 MB), scoped to repositories connected to the agent's workspace; reject any write/branch/commit/PR operation, missing/oversize files, not-connected repos, and unavailable repos with appropriate errors; emit an Audit_Log_Entry (agent id, repo id, path, timestamp) on every file read via the shared AuditService port; expose the reader only to the Agent_Runner
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [ ]* 18.2 Write property test for read-only repository access
    - **Property 6: Read-only repository access**
    - **Validates: Requirements 11.5, 11.6**

  - [ ]* 18.3 Write unit tests for repository context limits and scoping
    - Cover entry/match/size limits, workspace scoping, not-connected/unavailable/missing-file errors, and the audit emission on read
    - _Requirements: 11.1, 11.2, 11.3, 11.7, 11.8, 11.9, 11.10_

- [ ] 19. Notifications
  - [ ] 19.1 Implement NotificationsModule / Notification_Service and wiring
    - Create notifications within 5s for mentions (excluding self-mentions), agent run completion/failure (to the requester), workspace invites, and PR opened/merged (to room members except the trigger user); implement `GET /api/notifications` (own, newest-first, page size 50, reject cross-user), owner-only `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/read-all` (reject unknown/non-owned); wire creation hooks into messaging, agent-run, invite, and webhook flows
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [ ]* 19.2 Write property test for notification ownership
    - **Property 8: Notification ownership**
    - **Validates: Requirements 13.2, 13.7, 13.9**

  - [ ]* 19.3 Write unit tests for notification creation rules
    - Cover self-mention exclusion, agent completion/failure targeting, and PR-event member targeting excluding the trigger user
    - _Requirements: 13.1, 13.3, 13.5_

  - [ ]* 19.4 Write integration tests for notification endpoints
    - Assert ownership-scoped listing/pagination and read/read-all behavior with cross-user rejection
    - _Requirements: 13.6, 13.7, 13.8_

- [ ] 20. Audit logs
  - [ ] 20.1 Implement AuditLogsModule / Audit_Service and wiring
    - Implement the best-effort async audit writer (up to 3 retries, never rolls back the originating action) recording one entry per sensitive action (workspace create, member invite, role change, GitHub connect, repo connect, agent run create, agent file read) with actor id/type, action, target id, ISO 8601 UTC timestamp, and metadata; implement Owner/Admin-only `GET .../audit-logs` (newest-first, page size 100; deny Member/Guest); wire the writer into all listed call sites including the repository reader port from task 18.1
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 20.2 Write property test for audit durability
    - **Property 9: Audit durability**
    - **Validates: Requirements 12.1, 12.6**

  - [ ]* 20.3 Write unit tests for audit recording
    - Cover actor-type tagging (user vs agent), retry-on-failure without reversing the action, and entry field completeness
    - _Requirements: 12.2, 12.3, 12.6_

  - [ ]* 20.4 Write integration tests for audit log access
    - Assert Owner/Admin newest-first paginated retrieval and Member/Guest denial
    - _Requirements: 12.4, 12.5_

- [ ] 21. Frontend integration (apps/web)
  - [ ] 21.1 Add typed API client and WebSocket client to the web app
    - Add a typed REST client (reusing `packages/shared` Zod schemas/types) and a WebSocket client hook in `apps/web/lib`, replacing direct mock-data imports for the targeted surfaces; keep clients out of view components per PROJECT_RULES
    - Run `pnpm check:guardrails`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
    - _Requirements: 1.4, 2.6, 14.1_

  - [ ] 21.2 Wire authentication and workspace switching UI to the API
    - Connect sign-in/sign-up and workspace list/switch flows to the API via feature components in `components/<feature>` and thin routes, using semantic tokens and URL-worthy state for the active workspace
    - Run `pnpm check:guardrails`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
    - _Requirements: 1.1, 1.4, 2.6, 2.7_

  - [ ] 21.3 Wire room chat, realtime, and agent run status UI
    - Connect room message history/send/edit/delete, realtime message and agent-run events, and agent run status indicators using the API + WS clients, keeping domain/view-model logic in `lib/<feature>` and `components/<feature>/use-*.ts`
    - Run `pnpm check:guardrails`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
    - _Requirements: 5.3, 5.4, 5.6, 6.4, 7.10_

- [ ] 22. Access control and performance hardening
  - [ ] 22.1 Audit and finalize cross-cutting authorization and performance
    - Verify every workspace-scoped route applies the membership + role guards and every room-scoped route applies the room membership guard; ensure all list endpoints use the cursor-pagination helper; confirm message send writes a single indexed row with asynchronous publish and that room initial load uses the `Message(roomId, createdAt)` index for the 50 most recent messages
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 22.2 Write integration tests for the access-control matrix and pagination
    - Assert workspace/room non-member denial across representative routes and cursor-pagination page sizes (messages 50, audit 100, notifications 50)
    - _Requirements: 14.1, 14.2, 14.4_

- [ ] 23. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation sub-tasks are never optional.
- Each task references specific requirements for traceability; property-test tasks reference the design's Correctness Properties (Property 1-10).
- Property tests use `fast-check` over Jest; unit and integration tests validate specific examples and authorization matrices. Backend tests run against a test Postgres + Redis.
- Checkpoints provide incremental validation points; the worker and api share the `database`, `shared`, `agent-core`, and `github-core` packages so types and validation are defined once.
- Frontend tasks follow `AGENTS.md` and `web/PROJECT_RULES.md` and must pass `pnpm check:guardrails`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- The shared `AuditService` port (task 1.2) lets call sites record audit entries before the concrete writer is implemented in task 20.1.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5"] },
    { "id": 3, "tasks": ["2.1", "15.1"] },
    { "id": 4, "tasks": ["2.2", "2.4"] },
    { "id": 5, "tasks": ["2.3", "2.5", "4.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 7, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3", "7.1", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4", "10.1"] },
    { "id": 10, "tasks": ["10.2", "12.1"] },
    { "id": 11, "tasks": ["12.2", "12.3", "12.4", "12.5", "13.1"] },
    { "id": 12, "tasks": ["13.2", "13.3", "15.2"] },
    { "id": 13, "tasks": ["15.3", "15.4", "16.1"] },
    { "id": 14, "tasks": ["16.2", "16.3", "17.1"] },
    { "id": 15, "tasks": ["17.2", "17.3", "17.4", "18.1"] },
    { "id": 16, "tasks": ["18.2", "18.3", "19.1"] },
    { "id": 17, "tasks": ["19.2", "19.3", "19.4", "20.1"] },
    { "id": 18, "tasks": ["20.2", "20.3", "20.4", "21.1"] },
    { "id": 19, "tasks": ["21.2", "21.3"] },
    { "id": 20, "tasks": ["22.1"] },
    { "id": 21, "tasks": ["22.2"] }
  ]
}
```
