# Technical Specification: AI Collaboration Workspace

## 1. System Overview

### Product

AI Collaboration Workspace

### Purpose

Build a web-based collaboration platform where users can create workspaces, create realtime rooms, chat with teammates, connect GitHub repositories, and collaborate with AI agents inside the same room.

The system should support:

```txt
Human chat
AI agent messages
GitHub-connected rooms
Repository-aware AI responses
Background agent tasks
Realtime room updates
Audit logs
Notifications
```

---

## 2. Technical Goals

```txt
1. Build a scalable modular monolith.
2. Support realtime chat using WebSocket.
3. Support long-running AI tasks using queue workers.
4. Store product data in PostgreSQL.
5. Use Redis for queues, presence, and realtime scaling.
6. Integrate with GitHub through GitHub App.
7. Keep agent repository access permission-based.
8. Track all sensitive AI and GitHub actions using audit logs.
9. Keep MVP read-only for repository access.
10. Prepare architecture for future agent code execution and PR creation.
```

---

## 3. Recommended Tech Stack

```txt
Frontend:
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
React Hook Form
Zod

Backend:
NestJS
TypeScript
REST API
WebSocket Gateway
JWT/session auth
class-validator or Zod

Database:
Neon PostgreSQL
Prisma ORM
Prisma Migrate

Realtime:
NestJS WebSocket Gateway
Socket.IO
Redis adapter

Queue:
BullMQ
Redis
Worker service

AI:
OpenAI-compatible LLM provider
Custom agent runner
Streaming response through WebSocket

GitHub:
GitHub App
Octokit
GitHub Webhooks

Storage:
Cloudflare R2 or AWS S3-compatible storage

Deployment:
Vercel for frontend
Railway/Fly.io/Render for API and workers
Neon for PostgreSQL
Upstash Redis for Redis
Sentry for error tracking
```

---

## 4. Monorepo Structure

```txt
ai-collaboration-workspace/
  apps/
    web/
      # Next.js frontend

    api/
      # NestJS API server
      # REST controllers
      # WebSocket gateway

    worker/
      # BullMQ worker
      # AI task processor
      # GitHub webhook processors

  packages/
    database/
      # Prisma schema
      # Prisma migrations
      # Prisma client

    shared/
      # Shared TypeScript types
      # DTOs
      # constants
      # enums

    ui/
      # Shared frontend UI components

    agent-core/
      # Agent tools
      # Agent prompts
      # Agent runner
      # Agent memory helpers

    github-core/
      # Octokit helpers
      # GitHub App helpers
      # Webhook event mapping

    config/
      # Shared eslint, tsconfig, prettier config
```

---

## 5. High-Level Architecture

```txt
User Browser
  ↓
Next.js Web App
  ↓ REST API / WebSocket
NestJS API Server
  ↓
PostgreSQL / Redis / Object Storage
  ↓
BullMQ Queue
  ↓
Worker Service
  ↓
LLM Provider / GitHub API
```

### Runtime Flow

```txt
1. User sends a message in a room.
2. Web app sends request to API.
3. API validates workspace and room permission.
4. API stores message in PostgreSQL.
5. API broadcasts message through WebSocket.
6. If message mentions an AI agent, API creates agent_run.
7. API pushes job to BullMQ.
8. Worker picks the job.
9. Worker loads room context and repository context.
10. Worker calls LLM provider.
11. Worker streams agent output back through WebSocket.
12. Worker stores final output as an agent message.
13. API/worker writes audit logs.
```

---

## 6. Backend Modules

```txt
AuthModule
UsersModule
WorkspacesModule
WorkspaceMembersModule
RoomsModule
RoomMembersModule
MessagesModule
AgentsModule
AgentRunsModule
GithubModule
GithubWebhooksModule
NotificationsModule
AuditLogsModule
FilesModule
SearchModule
RealtimeModule
```

---

## 7. Database Schema

## 7.1 users

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  githubUserId  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workspaceMembers WorkspaceMember[]
  messages          Message[]
  agentRuns         AgentRun[]
}
```

---

## 7.2 workspaces

```prisma
model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  avatarUrl   String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members      WorkspaceMember[]
  rooms        Room[]
  agents       Agent[]
  githubRepos  GithubRepository[]
  auditLogs    AuditLog[]
}
```

---

## 7.3 workspace_members

```prisma
model WorkspaceMember {
  id          String              @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceMemberRole @default(MEMBER)
  status      MemberStatus        @default(ACTIVE)
  joinedAt    DateTime?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@unique([workspaceId, userId])
}

enum WorkspaceMemberRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

enum MemberStatus {
  INVITED
  ACTIVE
  SUSPENDED
}
```

---

## 7.4 rooms

```prisma
model Room {
  id                  String     @id @default(cuid())
  workspaceId         String
  githubRepositoryId  String?
  name                String
  slug                String
  description         String?
  type                RoomType   @default(GENERAL)
  status              RoomStatus @default(ACTIVE)
  createdById         String
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  workspace        Workspace         @relation(fields: [workspaceId], references: [id])
  members          RoomMember[]
  messages         Message[]
  agentRuns        AgentRun[]
  githubRepository GithubRepository? @relation(fields: [githubRepositoryId], references: [id])

  @@unique([workspaceId, slug])
}

enum RoomType {
  GENERAL
  REPOSITORY
  PULL_REQUEST
  AGENT_TASK
}

enum RoomStatus {
  ACTIVE
  ARCHIVED
}
```

---

## 7.5 room_members

```prisma
model RoomMember {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  role      RoomRole @default(MEMBER)
  joinedAt  DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id])

  @@unique([roomId, userId])
}

enum RoomRole {
  ADMIN
  MEMBER
}
```

---

## 7.6 messages

```prisma
model Message {
  id             String        @id @default(cuid())
  workspaceId    String
  roomId         String
  senderType     MessageSender
  senderUserId   String?
  senderAgentId  String?
  content        String
  contentType    MessageType   @default(TEXT)
  metadata       Json?
  editedAt       DateTime?
  deletedAt      DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  room       Room      @relation(fields: [roomId], references: [id])
  senderUser User?     @relation(fields: [senderUserId], references: [id])
  agent      Agent?    @relation(fields: [senderAgentId], references: [id])

  @@index([workspaceId, roomId, createdAt])
}

enum MessageSender {
  USER
  AGENT
  SYSTEM
  GITHUB
}

enum MessageType {
  TEXT
  MARKDOWN
  SYSTEM_EVENT
  AGENT_RESPONSE
  GITHUB_EVENT
  FILE_ATTACHMENT
}
```

---

## 7.7 agents

```prisma
model Agent {
  id            String      @id @default(cuid())
  workspaceId   String
  name          String
  description   String?
  type          AgentType
  status        AgentStatus @default(ACTIVE)
  modelProvider String
  modelName     String
  systemPrompt  String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  workspace Workspace  @relation(fields: [workspaceId], references: [id])
  messages  Message[]
  runs      AgentRun[]
}

enum AgentType {
  ASSISTANT
  REPOSITORY
  PULL_REQUEST
  DOCUMENTATION
  QA
}

enum AgentStatus {
  ACTIVE
  DISABLED
}
```

---

## 7.8 agent_runs

```prisma
model AgentRun {
  id              String         @id @default(cuid())
  workspaceId     String
  roomId          String
  agentId         String
  requestedById   String
  sourceMessageId String?
  taskType        AgentTaskType
  status          AgentRunStatus @default(PENDING)
  input           Json
  output          Json?
  errorMessage    String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  room        Room          @relation(fields: [roomId], references: [id])
  agent       Agent         @relation(fields: [agentId], references: [id])
  requestedBy User          @relation(fields: [requestedById], references: [id])
  steps       AgentRunStep[]

  @@index([workspaceId, roomId, status])
}

model AgentRunStep {
  id          String   @id @default(cuid())
  agentRunId  String
  name        String
  status      String
  input       Json?
  output      Json?
  error       String?
  createdAt   DateTime @default(now())

  agentRun AgentRun @relation(fields: [agentRunId], references: [id])
}

enum AgentRunStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum AgentTaskType {
  GENERAL_CHAT
  EXPLAIN_REPOSITORY
  SUMMARIZE_ROOM
  SUMMARIZE_PR
  REVIEW_PR
  GENERATE_DOCS
  GENERATE_TEST_CASES
}
```

---

## 7.9 github_installations

```prisma
model GithubInstallation {
  id             String   @id @default(cuid())
  workspaceId    String
  installationId String   @unique
  accountLogin   String
  accountType    String
  status         String   @default("ACTIVE")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  repositories GithubRepository[]
}
```

---

## 7.10 github_repositories

```prisma
model GithubRepository {
  id              String   @id @default(cuid())
  workspaceId      String
  installationId   String
  githubRepoId     String
  owner            String
  name             String
  fullName         String
  private          Boolean
  defaultBranch    String
  htmlUrl          String
  status           String   @default("CONNECTED")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  rooms        Room[]

  @@unique([workspaceId, githubRepoId])
}
```

---

## 7.11 github_events

```prisma
model GithubEvent {
  id             String   @id @default(cuid())
  workspaceId    String
  repositoryId   String?
  deliveryId     String   @unique
  eventType      String
  action         String?
  payload        Json
  createdAt      DateTime @default(now())

  @@index([workspaceId, eventType, createdAt])
}
```

---

## 7.12 notifications

```prisma
model Notification {
  id          String    @id @default(cuid())
  workspaceId String?
  userId      String
  type        String
  title       String
  body        String?
  metadata    Json?
  readAt      DateTime?
  createdAt   DateTime  @default(now())

  @@index([userId, readAt, createdAt])
}
```

---

## 7.13 audit_logs

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  workspaceId   String
  actorType     String
  actorUserId   String?
  actorAgentId  String?
  action        String
  targetType    String
  targetId      String?
  metadata      Json?
  createdAt     DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, action, createdAt])
}
```

---

## 8. API Design

## 8.1 Standard API Response

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: unknown;
  };
}
```

---

## 8.2 Pagination Response

```ts
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

---

## 8.3 Auth APIs

```txt
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/github
GET  /api/auth/github/callback
```

### POST /api/auth/signup

```json
{
  "email": "user@example.com",
  "password": "password",
  "name": "John Doe"
}
```

### Response

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## 8.4 Workspace APIs

```txt
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:workspaceId
PATCH  /api/workspaces/:workspaceId
DELETE /api/workspaces/:workspaceId

GET    /api/workspaces/:workspaceId/members
POST   /api/workspaces/:workspaceId/invitations
PATCH  /api/workspaces/:workspaceId/members/:memberId
DELETE /api/workspaces/:workspaceId/members/:memberId
```

### POST /api/workspaces

```json
{
  "name": "Engineering Team",
  "slug": "engineering-team"
}
```

---

## 8.5 Room APIs

```txt
GET    /api/workspaces/:workspaceId/rooms
POST   /api/workspaces/:workspaceId/rooms
GET    /api/workspaces/:workspaceId/rooms/:roomId
PATCH  /api/workspaces/:workspaceId/rooms/:roomId
DELETE /api/workspaces/:workspaceId/rooms/:roomId

POST   /api/workspaces/:workspaceId/rooms/:roomId/members
DELETE /api/workspaces/:workspaceId/rooms/:roomId/members/:memberId
```

### POST /api/workspaces/:workspaceId/rooms

```json
{
  "name": "Frontend Platform",
  "description": "Frontend development room",
  "type": "REPOSITORY",
  "githubRepositoryId": "repo_id"
}
```

---

## 8.6 Message APIs

```txt
GET    /api/workspaces/:workspaceId/rooms/:roomId/messages
POST   /api/workspaces/:workspaceId/rooms/:roomId/messages
PATCH  /api/workspaces/:workspaceId/rooms/:roomId/messages/:messageId
DELETE /api/workspaces/:workspaceId/rooms/:roomId/messages/:messageId
```

### POST /api/workspaces/:workspaceId/rooms/:roomId/messages

```json
{
  "content": "@repo-agent explain this repository structure",
  "contentType": "MARKDOWN",
  "mentionedAgentIds": ["agent_id"]
}
```

### Response

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "message_id",
      "content": "@repo-agent explain this repository structure",
      "senderType": "USER",
      "createdAt": "2026-06-28T10:00:00.000Z"
    },
    "agentRun": {
      "id": "agent_run_id",
      "status": "PENDING"
    }
  }
}
```

---

## 8.7 Agent APIs

```txt
GET    /api/workspaces/:workspaceId/agents
POST   /api/workspaces/:workspaceId/agents
GET    /api/workspaces/:workspaceId/agents/:agentId
PATCH  /api/workspaces/:workspaceId/agents/:agentId
DELETE /api/workspaces/:workspaceId/agents/:agentId

POST   /api/workspaces/:workspaceId/rooms/:roomId/agent-runs
GET    /api/workspaces/:workspaceId/rooms/:roomId/agent-runs
GET    /api/workspaces/:workspaceId/agent-runs/:agentRunId
POST   /api/workspaces/:workspaceId/agent-runs/:agentRunId/cancel
```

### POST /api/workspaces/:workspaceId/rooms/:roomId/agent-runs

```json
{
  "agentId": "agent_id",
  "taskType": "EXPLAIN_REPOSITORY",
  "input": {
    "prompt": "Explain this repository structure"
  }
}
```

---

## 8.8 GitHub APIs

```txt
GET  /api/workspaces/:workspaceId/github/installations
GET  /api/workspaces/:workspaceId/github/repositories
POST /api/workspaces/:workspaceId/github/repositories/connect
POST /api/github/webhooks
GET  /api/workspaces/:workspaceId/github/events
```

### POST /api/workspaces/:workspaceId/github/repositories/connect

```json
{
  "installationId": "123456",
  "githubRepoId": "987654",
  "owner": "company",
  "name": "frontend-app",
  "fullName": "company/frontend-app",
  "private": true,
  "defaultBranch": "main",
  "htmlUrl": "https://github.com/company/frontend-app"
}
```

---

## 8.9 Notification APIs

```txt
GET   /api/notifications
PATCH /api/notifications/:notificationId/read
PATCH /api/notifications/read-all
```

---

## 9. WebSocket Specification

## 9.1 Connection

Client connects to:

```txt
ws://localhost:3001/socket
```

Production:

```txt
wss://api.example.com/socket
```

Authentication should be passed through secure session cookie or authorization token.

---

## 9.2 Client to Server Events

### room:join

```json
{
  "workspaceId": "workspace_id",
  "roomId": "room_id"
}
```

### room:leave

```json
{
  "workspaceId": "workspace_id",
  "roomId": "room_id"
}
```

### message:send

```json
{
  "workspaceId": "workspace_id",
  "roomId": "room_id",
  "content": "Hello team",
  "contentType": "TEXT"
}
```

### message:typing:start

```json
{
  "workspaceId": "workspace_id",
  "roomId": "room_id"
}
```

### message:typing:stop

```json
{
  "workspaceId": "workspace_id",
  "roomId": "room_id"
}
```

### agent:run:create

```json
{
  "workspaceId": "workspace_id",
  "roomId": "room_id",
  "agentId": "agent_id",
  "taskType": "GENERAL_CHAT",
  "input": {
    "prompt": "Summarize this room"
  }
}
```

---

## 9.3 Server to Client Events

### message:created

```json
{
  "id": "message_id",
  "roomId": "room_id",
  "senderType": "USER",
  "content": "Hello team",
  "contentType": "TEXT",
  "createdAt": "2026-06-28T10:00:00.000Z"
}
```

### agent:run:created

```json
{
  "id": "agent_run_id",
  "roomId": "room_id",
  "agentId": "agent_id",
  "status": "PENDING"
}
```

### agent:run:started

```json
{
  "id": "agent_run_id",
  "status": "RUNNING",
  "startedAt": "2026-06-28T10:00:00.000Z"
}
```

### agent:run:step

```json
{
  "id": "agent_run_id",
  "step": {
    "name": "Loading repository context",
    "status": "COMPLETED"
  }
}
```

### agent:run:token

```json
{
  "id": "agent_run_id",
  "token": "Repository"
}
```

### agent:run:completed

```json
{
  "id": "agent_run_id",
  "status": "COMPLETED",
  "messageId": "message_id",
  "completedAt": "2026-06-28T10:01:00.000Z"
}
```

### agent:run:failed

```json
{
  "id": "agent_run_id",
  "status": "FAILED",
  "errorMessage": "Failed to load repository context"
}
```

### github:event:created

```json
{
  "id": "github_event_id",
  "eventType": "pull_request",
  "action": "opened",
  "repository": "company/frontend-app",
  "createdAt": "2026-06-28T10:00:00.000Z"
}
```

---

## 10. Agent Architecture

## 10.1 Agent Runner

The agent runner should be implemented inside `packages/agent-core`.

```txt
agent-core/
  src/
    agents/
      assistant.agent.ts
      repository.agent.ts
      pull-request.agent.ts
      docs.agent.ts
      qa.agent.ts

    tools/
      room-context.tool.ts
      repository-files.tool.ts
      github-pr.tool.ts
      code-search.tool.ts

    prompts/
      assistant.prompt.ts
      repository.prompt.ts
      pr-review.prompt.ts
      docs.prompt.ts
      qa.prompt.ts

    runner/
      agent-runner.ts
      agent-context.ts
      agent-stream.ts
```

---

## 10.2 Agent Context Object

```ts
export interface AgentExecutionContext {
  workspaceId: string;
  roomId: string;
  agentId: string;
  agentRunId: string;
  requestedById: string;
  sourceMessageId?: string;
  prompt: string;
  roomMessages: AgentRoomMessage[];
  repository?: AgentRepositoryContext;
}
```

---

## 10.3 Agent Tools

### room_context

Loads recent messages from the current room.

```ts
type RoomContextToolInput = {
  roomId: string;
  limit: number;
};
```

### repository_file_list

Lists files from connected GitHub repository.

```ts
type RepositoryFileListInput = {
  repositoryId: string;
  branch?: string;
  path?: string;
};
```

### repository_file_read

Reads selected file content.

```ts
type RepositoryFileReadInput = {
  repositoryId: string;
  branch?: string;
  path: string;
};
```

### code_search

Searches repository files by keyword.

```ts
type CodeSearchInput = {
  repositoryId: string;
  query: string;
};
```

### github_pr_summary

Loads PR metadata and changed files.

```ts
type GithubPrSummaryInput = {
  repositoryId: string;
  pullNumber: number;
};
```

---

## 10.4 Agent Run Status Flow

```txt
PENDING
  ↓
RUNNING
  ↓
COMPLETED

PENDING
  ↓
RUNNING
  ↓
FAILED

PENDING
  ↓
CANCELLED
```

---

## 10.5 Agent Task Processor Flow

```txt
1. Receive BullMQ job.
2. Load agent_run.
3. Validate status is PENDING.
4. Mark agent_run as RUNNING.
5. Broadcast agent:run:started.
6. Load room context.
7. Load repository context if room has connected repository.
8. Build system prompt.
9. Execute LLM request.
10. Stream tokens through WebSocket.
11. Store final response in messages table.
12. Mark agent_run as COMPLETED.
13. Broadcast agent:run:completed.
14. Write audit logs.
```

---

## 11. GitHub Integration

## 11.1 GitHub App Permissions

Recommended MVP permissions:

```txt
Repository metadata: Read-only
Contents: Read-only
Pull requests: Read-only
Issues: Read-only
Commit statuses: Read-only
Checks: Read-only
Webhooks: Enabled
```

Version 2 permissions:

```txt
Contents: Read and write
Pull requests: Read and write
Checks: Read-only
```

---

## 11.2 Webhook Events

Support these events first:

```txt
push
pull_request
issues
issue_comment
pull_request_review
check_run
check_suite
```

---

## 11.3 Webhook Processing Flow

```txt
1. GitHub sends webhook request.
2. API validates webhook signature.
3. API checks delivery ID for idempotency.
4. API stores raw webhook payload.
5. API maps event to workspace and repository.
6. API creates github_event record.
7. API broadcasts event to linked rooms.
8. API creates notification if needed.
```

---

## 11.4 GitHub Repository Access Flow

```txt
1. User installs GitHub App.
2. GitHub redirects back to app.
3. API stores installation ID.
4. User selects repositories.
5. API stores connected repositories.
6. Room links to repository.
7. Agent uses installation token to read repository content.
8. Agent access is logged in audit_logs.
```

---

## 12. Authorization Rules

## 12.1 Workspace Access

```txt
User must be an active workspace member.
```

## 12.2 Workspace Admin Actions

Allowed roles:

```txt
OWNER
ADMIN
```

Actions:

```txt
Update workspace
Invite member
Remove member
Change member role
Connect GitHub repository
Manage agents
View audit logs
```

## 12.3 Room Access

```txt
User must be workspace member.
User must be room member unless room is public inside workspace.
Archived room is read-only.
```

## 12.4 Agent Access

```txt
User can trigger agent only if:
1. User has room access.
2. Agent belongs to same workspace.
3. Agent status is ACTIVE.
4. Agent has permission for requested task type.
5. Repository is connected to same workspace.
```

## 12.5 GitHub Access

```txt
Agent can read repository only if:
1. Repository is connected to workspace.
2. Room is linked to repository.
3. GitHub installation is active.
4. Agent task requires repository context.
```

---

## 13. Security Requirements

```txt
1. Never expose GitHub installation tokens to frontend.
2. Never store plain text passwords.
3. Validate all input DTOs.
4. Validate WebSocket authorization.
5. Validate workspaceId on every request.
6. Use GitHub webhook signature validation.
7. Apply rate limits to auth, messages, and agent task creation.
8. Log all agent repository reads.
9. Prevent cross-workspace data access.
10. Store secrets in environment variables or secret manager.
11. Use short-lived GitHub installation tokens.
12. Sanitize markdown output before rendering.
13. Do not allow arbitrary code execution in MVP.
```

---

## 14. Environment Variables

```env
# App
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@host/db

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=replace_me
SESSION_SECRET=replace_me

# GitHub OAuth
GITHUB_CLIENT_ID=replace_me
GITHUB_CLIENT_SECRET=replace_me

# GitHub App
GITHUB_APP_ID=replace_me
GITHUB_APP_PRIVATE_KEY=replace_me
GITHUB_WEBHOOK_SECRET=replace_me

# AI
OPENAI_API_KEY=replace_me
DEFAULT_MODEL=gpt-4.1-mini

# Storage
S3_ENDPOINT=replace_me
S3_ACCESS_KEY_ID=replace_me
S3_SECRET_ACCESS_KEY=replace_me
S3_BUCKET=replace_me
S3_REGION=auto

# Observability
SENTRY_DSN=replace_me
```

---

## 15. Frontend Page Structure

```txt
app/
  (public)/
    page.tsx
    login/
    signup/

  (auth)/
    callback/
      github/

  (app)/
    workspaces/
      page.tsx

    [workspaceSlug]/
      layout.tsx
      page.tsx

      rooms/
        page.tsx
        [roomId]/
          page.tsx

      agents/
        page.tsx
        [agentId]/
          page.tsx

      github/
        page.tsx
        repositories/
          page.tsx

      settings/
        members/
          page.tsx
        audit-logs/
          page.tsx
        general/
          page.tsx

      notifications/
        page.tsx
```

---

## 16. Frontend Components

```txt
components/
  layout/
    AppSidebar.tsx
    WorkspaceSwitcher.tsx
    UserMenu.tsx

  rooms/
    RoomList.tsx
    RoomHeader.tsx
    RoomMembers.tsx
    RoomSettingsDialog.tsx

  messages/
    MessageList.tsx
    MessageBubble.tsx
    MessageComposer.tsx
    AgentMessageBubble.tsx
    SystemMessage.tsx
    GithubEventMessage.tsx

  agents/
    AgentSelector.tsx
    AgentRunStatusCard.tsx
    AgentRunSteps.tsx
    AgentMentionItem.tsx

  github/
    GithubInstallButton.tsx
    RepositoryList.tsx
    RepositoryConnectDialog.tsx
    GithubEventCard.tsx

  notifications/
    NotificationDropdown.tsx
    NotificationList.tsx

  audit/
    AuditLogTable.tsx
```

---

## 17. Frontend State Management

Use TanStack Query for server state:

```txt
workspaces
rooms
messages
agents
agentRuns
githubRepositories
notifications
auditLogs
```

Use Zustand for local app state:

```txt
selectedWorkspace
activeRoom
sidebarCollapsed
composerDraft
connectedSocketState
```

Use WebSocket events to update TanStack Query cache.

---

## 18. Message Loading Strategy

```txt
1. Load latest 50 messages when opening room.
2. Use cursor-based pagination for older messages.
3. Subscribe to WebSocket room events.
4. Append new realtime messages to list.
5. Use optimistic UI for user-sent messages.
6. Replace temporary message after API confirms.
```

---

## 19. Queue Design

## 19.1 Queue Names

```txt
agent-runs
github-webhooks
notifications
repository-sync
```

---

## 19.2 BullMQ Job Payload

```ts
export interface AgentRunJobPayload {
  agentRunId: string;
  workspaceId: string;
  roomId: string;
  agentId: string;
  requestedById: string;
}
```

---

## 19.3 Worker Processing

```txt
agent-runs worker:
1. Load job payload.
2. Load agent run.
3. Execute agent runner.
4. Update database.
5. Broadcast realtime status.
6. Write audit logs.
```

---

## 20. Audit Log Actions

```txt
workspace.created
workspace.updated
workspace.deleted

member.invited
member.role_updated
member.removed

room.created
room.updated
room.archived

message.created
message.updated
message.deleted

agent.created
agent.updated
agent.disabled
agent.run_created
agent.run_started
agent.run_completed
agent.run_failed
agent.repository_file_read

github.app_installed
github.repository_connected
github.repository_disconnected
github.webhook_received

notification.created
```

---

## 21. Error Handling

## 21.1 API Error Format

```json
{
  "success": false,
  "message": "You do not have permission to access this room",
  "data": null,
  "error": {
    "code": "ROOM_ACCESS_DENIED",
    "details": {}
  }
}
```

---

## 21.2 Common Error Codes

```txt
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
WORKSPACE_NOT_FOUND
ROOM_NOT_FOUND
ROOM_ACCESS_DENIED
AGENT_NOT_FOUND
AGENT_DISABLED
AGENT_RUN_NOT_FOUND
GITHUB_INSTALLATION_NOT_FOUND
GITHUB_REPOSITORY_NOT_CONNECTED
GITHUB_WEBHOOK_INVALID_SIGNATURE
RATE_LIMIT_EXCEEDED
INTERNAL_SERVER_ERROR
```

---

## 22. Rate Limiting

```txt
Auth login:
5 requests per minute per IP

Message send:
60 requests per minute per user

Agent run create:
10 requests per hour per user for MVP

GitHub webhook:
No strict user rate limit, but validate signature and delivery ID

File upload:
20 uploads per hour per user
```

---

## 23. Performance Requirements

```txt
Room initial load:
Less than 2 seconds

Send message:
Less than 500ms perceived latency

WebSocket event broadcast:
Less than 300ms internal latency

Agent run creation:
Less than 1 second

Agent first streamed token:
Depends on model provider, but should stream as soon as available

Message pagination:
Use cursor pagination, not offset pagination for large rooms

Audit log list:
Paginated and indexed by workspaceId and createdAt
```

---

## 24. Indexing Strategy

Add indexes for:

```txt
messages(workspaceId, roomId, createdAt)
agent_runs(workspaceId, roomId, status)
github_events(workspaceId, eventType, createdAt)
notifications(userId, readAt, createdAt)
audit_logs(workspaceId, action, createdAt)
workspace_members(workspaceId, userId)
room_members(roomId, userId)
github_repositories(workspaceId, githubRepoId)
```

---

## 25. Testing Strategy

## 25.1 Unit Tests

```txt
Auth service
Workspace service
Room service
Message service
Agent run service
GitHub webhook signature validator
Permission guards
Agent tool functions
```

## 25.2 Integration Tests

```txt
Create workspace flow
Create room flow
Send message flow
Mention agent flow
Create agent run flow
GitHub webhook processing flow
Repository connection flow
```

## 25.3 E2E Tests

```txt
User signs up
User creates workspace
User creates room
User sends message
User mentions agent
Agent responds
Admin connects GitHub repo
GitHub event appears in room
```

---

## 26. Deployment Architecture

## 26.1 MVP Deployment

```txt
Frontend:
Vercel

API:
Railway / Render / Fly.io

Worker:
Railway / Render / Fly.io

Database:
Neon PostgreSQL

Redis:
Upstash Redis

Storage:
Cloudflare R2

Monitoring:
Sentry
```

---

## 26.2 Production Deployment

```txt
Frontend:
Vercel or Cloudflare Pages

API:
AWS ECS / Kubernetes

Worker:
AWS ECS / Kubernetes worker service

Database:
Neon PostgreSQL or AWS RDS PostgreSQL

Redis:
AWS ElastiCache or Upstash Redis

Storage:
AWS S3 or Cloudflare R2

Observability:
Sentry
OpenTelemetry
Grafana
Loki
Prometheus
```

---

## 27. CI/CD

## 27.1 Pipeline Steps

```txt
1. Install dependencies.
2. Run lint.
3. Run type check.
4. Run unit tests.
5. Generate Prisma client.
6. Run Prisma migration check.
7. Build web.
8. Build api.
9. Build worker.
10. Deploy frontend.
11. Deploy API.
12. Deploy worker.
```

---

## 27.2 Branch Strategy

```txt
main:
Production branch

dev:
Development integration branch

feature/*:
Feature branches

fix/*:
Bug fix branches

release/*:
Release preparation branches
```

---

## 28. MVP Implementation Order

```txt
1. Create monorepo.
2. Set up Next.js app.
3. Set up NestJS API.
4. Set up Prisma and Neon.
5. Create auth module.
6. Create workspace module.
7. Create member module.
8. Create room module.
9. Create message module.
10. Add WebSocket gateway.
11. Add realtime room messaging.
12. Create agent module.
13. Create agent run module.
14. Add BullMQ and worker.
15. Implement basic AI response.
16. Add GitHub App setup.
17. Add repository connection.
18. Add GitHub webhook handler.
19. Add repository-aware agent tools.
20. Add notifications.
21. Add audit logs.
22. Add deployment configuration.
```

---

## 29. MVP Completion Criteria

```txt
1. User can sign up and log in.
2. User can create workspace.
3. User can invite workspace members.
4. User can create rooms.
5. User can send and receive realtime messages.
6. User can mention an AI agent.
7. AI agent can respond in the room.
8. Agent run status is visible.
9. Agent tasks run in background worker.
10. Admin can connect GitHub repository.
11. GitHub events are received and displayed.
12. Agent can read connected repository files.
13. Agent repository reads are audited.
14. Admin can view audit logs.
15. App can be deployed and tested by a small team.
```

---

## 30. Future Technical Extensions

```txt
1. Agent code editing.
2. Branch creation.
3. Pull request creation.
4. Diff preview and approval.
5. CI failure analysis.
6. Repository embeddings.
7. Semantic code search.
8. Usage billing.
9. Agent permission matrix.
10. Enterprise SSO.
11. Team analytics.
12. Self-hosted deployment.
13. Multi-agent workflows.
14. Sandbox execution using Docker or Firecracker.
```

---

## 31. Final Recommendation

Start with a modular monolith:

```txt
Next.js for frontend.
NestJS for API and WebSocket.
Neon PostgreSQL for product data.
Redis for queue, realtime scaling, and presence.
BullMQ for background AI task execution.
GitHub App for repository access.
Worker service for AI and GitHub processing.
```

Keep the first version read-only for repository access. Do not allow AI agents to modify code, push branches, or open pull requests until the permission, sandbox, approval, and audit systems are stable.
