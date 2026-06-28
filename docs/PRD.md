# PRD: AI Collaboration Workspace for Human + AI Agent Rooms

## 1. Product Overview

### Product Name

AI Collaboration Workspace

### Product Summary

Build a web-based collaboration platform where software teams can create workspaces, join rooms, connect GitHub repositories, and collaborate with AI agents inside shared chat rooms.

The product behaves like a team chat platform, but AI coding agents are first-class participants. Users can ask agents to explain code, summarize pull requests, review issues, create implementation plans, generate documentation, and eventually execute coding tasks through a controlled agent workflow.

### Recommended Technical Direction

Build the product as a **modular monolith first**.

```txt
Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui
Backend: NestJS + REST API + WebSocket Gateway
Database: Neon Postgres + Prisma
Realtime: WebSocket + Redis
Queue: BullMQ + Redis
AI: OpenAI-compatible LLM provider + custom agent runner
GitHub: GitHub App + Octokit + Webhooks
Storage: Cloudflare R2 or S3-compatible object storage
Deployment: Vercel + Railway/Fly.io/Render + Neon + Upstash Redis
```

Do not start with microservices. Split into services only when the agent runner, realtime system, or sandbox execution becomes too heavy.

---

## 2. Problem Statement

Modern software teams are increasingly using AI coding tools, but the collaboration flow is fragmented.

Common issues:

* AI work happens outside team discussion channels.
* Developers cannot easily track what agents are doing.
* Agent output is not connected clearly to GitHub repositories, issues, commits, or pull requests.
* Teams lack an audit trail for AI-generated actions.
* AI agents are usually used individually, not collaboratively.
* Long-running AI coding tasks need better visibility, queueing, and approval flow.

The product solves this by placing humans, AI agents, GitHub activity, and development context inside the same collaborative rooms.

---

## 3. Goals

### Business Goals

* Provide a workspace where teams can collaborate with AI coding agents.
* Improve developer productivity through AI-assisted code understanding, planning, review, and automation.
* Create a Git-connected collaboration environment for software teams.
* Build a foundation for future autonomous coding workflows.

### Product Goals

* Allow users to create workspaces and rooms.
* Allow users to invite members into workspaces.
* Allow users to connect GitHub repositories.
* Allow users to chat with human teammates and AI agents in realtime.
* Allow AI agents to answer questions based on repository context.
* Allow users to trigger AI tasks from a room.
* Track AI agent activity through visible run status and audit logs.

### Technical Goals

* Use a modular monolith architecture.
* Keep frontend, backend, workers, and shared packages organized in one monorepo.
* Support realtime communication through WebSocket.
* Support background AI jobs using BullMQ.
* Store structured product data in Neon Postgres.
* Store temporary agent run status and realtime state in Redis.
* Keep GitHub access controlled through a GitHub App.

---

## 4. Non-Goals

The first version will not support:

* Fully autonomous production deployment.
* AI agents pushing directly to protected branches.
* Multi-provider enterprise SSO.
* Self-hosted deployment.
* Mobile native apps.
* Complex project management features like Jira replacement.
* Public marketplace for agents.
* Advanced billing and usage-based pricing.
* Full IDE replacement.
* Unlimited code execution without sandbox restrictions.

---

## 5. Target Users

### 5.1 Software Developer

Uses the platform to discuss tasks, understand code, ask AI for help, and review AI-generated suggestions.

### 5.2 Tech Lead

Uses the platform to manage rooms, assign agent tasks, review output, and monitor team activity.

### 5.3 Product Owner

Uses the platform to follow feature discussions, read summaries, and understand delivery progress.

### 5.4 AI Agent

Acts as a system participant inside rooms. It can read context, respond to questions, summarize discussions, and execute controlled tasks.

### 5.5 Workspace Admin

Manages workspace settings, members, GitHub connections, agent permissions, and audit logs.

---

## 6. User Roles and Permissions

| Role   | Description       | Permissions                                                    |
| ------ | ----------------- | -------------------------------------------------------------- |
| Owner  | Workspace creator | Full workspace access, billing, integrations, delete workspace |
| Admin  | Workspace manager | Manage members, rooms, GitHub repos, agents                    |
| Member | Normal user       | Join rooms, send messages, trigger allowed agent tasks         |
| Guest  | Limited user      | Access invited rooms only                                      |
| Agent  | AI participant    | Can respond and execute allowed tools based on permissions     |

---

## 7. Core Features

## 7.1 Authentication

### Description

Users can sign in using email or GitHub.

### Requirements

* User can sign up with email.
* User can sign in with email.
* User can sign in with GitHub OAuth.
* User profile is created after first login.
* User can view profile information.
* User can log out.

### Acceptance Criteria

* User can successfully create an account.
* User can log in and access dashboard.
* Invalid login displays proper error message.
* GitHub login links the user account with GitHub identity.

---

## 7.2 Workspace Management

### Description

A workspace represents a team, organization, or project group.

### Requirements

* User can create workspace.
* User can update workspace name and avatar.
* User can invite members.
* Admin can remove members.
* Admin can change member role.
* User can switch between workspaces.
* Owner can delete workspace.

### Acceptance Criteria

* A new user can create their first workspace.
* Workspace members can only access workspaces they belong to.
* Non-admin users cannot manage members or workspace settings.

---

## 7.3 Room Management

### Description

Rooms are chat spaces where humans and AI agents collaborate.

### Requirements

* User can create room.
* User can update room name and description.
* User can archive room.
* User can invite members to room.
* User can remove members from room.
* Room can be linked to a GitHub repository.
* Room can have one or more AI agents assigned.

### Room Types

| Type              | Description                  |
| ----------------- | ---------------------------- |
| General Room      | Normal team discussion       |
| Repository Room   | Connected to a GitHub repo   |
| Pull Request Room | Created from a GitHub PR     |
| Agent Task Room   | Focused room for one AI task |

### Acceptance Criteria

* User can create and join a room.
* Only room members can view room messages.
* Archived rooms are read-only.
* Repository-connected rooms show linked GitHub repository metadata.

---

## 7.4 Realtime Chat

### Description

Users and agents communicate through realtime messages.

### Requirements

* User can send text message.
* User can send markdown message.
* User can upload attachment.
* User can edit own message.
* User can delete own message.
* User can react to messages.
* User can mention another user.
* User can mention an AI agent.
* User can view typing indicator.
* User can view online presence.
* Messages update in realtime.

### Message Types

| Type         | Description                      |
| ------------ | -------------------------------- |
| Text         | Normal user message              |
| Markdown     | Rich formatted message           |
| System       | System-generated event           |
| Agent        | AI-generated response            |
| GitHub Event | PR, issue, commit, webhook event |
| Agent Run    | AI task progress update          |

### Acceptance Criteria

* Messages appear instantly without page refresh.
* Multiple users in the same room receive updates.
* Agent responses stream into the room.
* Deleted messages are hidden or marked as deleted.
* Message history loads correctly when opening a room.

---

## 7.5 AI Agent in Room

### Description

AI agents act as room participants and can respond to user prompts.

### MVP Agent Capabilities

* Answer questions about room conversation.
* Explain connected repository structure.
* Summarize recent discussion.
* Summarize GitHub pull request.
* Generate implementation plan.
* Generate test case ideas.
* Generate documentation draft.
* Review code snippets pasted into chat.

### Requirements

* User can mention an agent.
* User can select agent type.
* Agent can respond in the room.
* Agent response can be streamed.
* Agent run status is visible.
* User can cancel running agent task.
* Agent messages are clearly labeled as AI-generated.

### Acceptance Criteria

* Mentioning an agent triggers an AI response.
* Agent response is posted as a message.
* User can see when the agent is thinking/running.
* Failed agent task shows readable error state.
* Agent cannot access unauthorized workspace data.

---

## 7.6 Agent Task Execution

### Description

Agent tasks are longer-running jobs created from room messages.

### Example Tasks

* Summarize repository.
* Explain selected file.
* Review pull request.
* Generate implementation checklist.
* Create bug investigation notes.
* Create documentation.
* Generate test cases.
* Suggest code changes.

### Requirements

* User can create agent task from a message.
* Agent task is stored as an `agent_run`.
* Agent task is processed in background queue.
* Agent run shows status: pending, running, completed, failed, cancelled.
* Agent run shows step-by-step progress.
* User can cancel an agent run.
* Agent run result is posted back to room.

### Acceptance Criteria

* Long-running agent task does not block the UI.
* User can leave room and return later to view result.
* Failed jobs are saved with error reason.
* Completed job links to generated output.

---

## 7.7 GitHub Integration

### Description

Users can connect GitHub repositories to rooms and allow AI agents to understand repository context.

### Requirements

* Admin can install GitHub App.
* Admin can select repositories.
* Workspace stores GitHub installation metadata.
* Room can be linked to repository.
* System receives GitHub webhook events.
* GitHub events appear inside linked rooms.
* User can view repository metadata.
* User can view pull request metadata.
* Agent can read repository context based on granted permissions.

### GitHub Events

| Event               | Usage                                   |
| ------------------- | --------------------------------------- |
| push                | Show commit activity                    |
| pull_request        | Show PR opened, updated, merged, closed |
| issues              | Show issue updates                      |
| issue_comment       | Show discussion updates                 |
| pull_request_review | Show review updates                     |
| check_run           | Show CI status                          |
| check_suite         | Show CI result                          |

### Acceptance Criteria

* GitHub App can be installed successfully.
* Connected repositories appear in workspace settings.
* GitHub webhook events are saved.
* Linked rooms display relevant GitHub activity.
* Agent cannot access repositories that are not connected.

---

## 7.8 Repository Context Reader

### Description

The system allows agents to read repository metadata and selected files.

### Requirements

* Agent can list repository files.
* Agent can read selected files.
* Agent can search code.
* Agent can summarize repository structure.
* Agent can answer questions from repository context.
* Repository access must respect GitHub permissions.

### MVP Constraint

In MVP, the agent should only read repository files. It should not push code or open pull requests yet.

### Acceptance Criteria

* User can ask: “Explain this repository.”
* Agent returns high-level project summary.
* User can ask: “Where is the auth logic?”
* Agent can search and provide likely files.
* All repository reads are logged.

---

## 7.9 Agent Code Change Workflow

### Version 2 Feature

This is not required for MVP but should be designed early.

### Description

Allow an AI agent to create branches, edit files, run tests, push commits, and open pull requests.

### Requirements

* User can request code change.
* Agent creates isolated run workspace.
* Agent clones repository.
* Agent creates new branch.
* Agent edits files.
* Agent runs tests/lint/build.
* Agent shows diff preview.
* User approves changes.
* Agent pushes branch.
* Agent opens pull request.

### Approval Rules

* Agent cannot push without user approval.
* Agent cannot push to protected branches.
* Agent cannot access secrets unless explicitly allowed.
* Agent must show diff before PR creation.

### Acceptance Criteria

* Agent creates a PR from generated changes.
* User can review diff before PR.
* Failed test result is displayed in room.
* All agent commands are logged.

---

## 7.10 Notifications

### Description

Users receive notifications for room mentions, agent completion, GitHub updates, and workspace invites.

### Requirements

* Notify user when mentioned.
* Notify user when agent task completes.
* Notify user when invited to workspace.
* Notify room when GitHub PR is opened.
* Notify room when GitHub PR is merged.
* User can mark notification as read.
* User can view notification list.

### Acceptance Criteria

* Mention creates notification.
* Agent completion creates notification for requester.
* Read notifications no longer appear as unread.

---

## 7.11 Search

### Description

Users can search messages, rooms, files, and agent outputs.

### Requirements

* Search room messages.
* Search workspace messages.
* Search agent run outputs.
* Search GitHub event logs.
* Search connected repository metadata.
* Support keyword search first.
* Semantic search can be added later.

### Acceptance Criteria

* User can find previous room messages.
* User can search by keyword.
* Search results link back to original room/message.

---

## 7.12 Audit Logs

### Description

The system records sensitive and important actions.

### Requirements

Audit these actions:

* Workspace created.
* Member invited.
* Member role changed.
* GitHub App connected.
* Repository connected.
* Agent task created.
* Agent read repository file.
* Agent generated output.
* Agent command executed.
* Agent opened pull request.
* Permission changed.

### Acceptance Criteria

* Admin can view audit log list.
* Audit logs include actor, action, target, timestamp, and metadata.
* Agent actions are clearly marked as agent actions.

---

## 8. MVP Scope

### MVP Version 1

The first release should focus on collaboration, chat, GitHub connection, and read-only AI agent assistance.

### Included Features

```txt
1. Email/GitHub authentication
2. Workspace creation
3. Member invitation
4. Room creation
5. Realtime room chat
6. AI agent mention and response
7. GitHub App installation
8. Connect repository to room
9. GitHub webhook event display
10. Repository read-only context for agent
11. Agent task queue
12. Agent run status
13. Basic audit logs
14. Basic notification center
```

### Excluded from MVP

```txt
1. Agent code editing
2. Agent branch creation
3. Agent pull request creation
4. Billing
5. Enterprise SSO
6. Mobile apps
7. Advanced analytics
8. Marketplace
```

---

## 9. Version 2 Scope

```txt
1. Agent creates branches
2. Agent edits code
3. Agent runs tests
4. Agent shows diff
5. User approves diff
6. Agent opens pull request
7. PR review agent
8. CI failure explanation
9. Codebase semantic search
10. Usage limits and billing
```

---

## 10. User Stories

### Authentication

```txt
As a user, I want to sign in with GitHub so that I can connect my repositories.
As a user, I want to sign in with email so that I can access the product without GitHub.
```

### Workspace

```txt
As a user, I want to create a workspace so that my team can collaborate.
As an admin, I want to invite members so that teammates can join the workspace.
As an admin, I want to manage roles so that workspace permissions are controlled.
```

### Rooms

```txt
As a member, I want to create a room so that I can discuss a project topic.
As a member, I want to link a GitHub repo to a room so that the room has repository context.
As a member, I want to add an AI agent to a room so that I can get AI assistance.
```

### Chat

```txt
As a member, I want to send messages in realtime so that team discussion is fast.
As a member, I want to mention teammates so that they are notified.
As a member, I want to mention an AI agent so that it can respond to my request.
```

### AI Agent

```txt
As a developer, I want to ask the agent about repository structure so that I can understand the project faster.
As a developer, I want the agent to summarize a PR so that I can review faster.
As a tech lead, I want to see agent run status so that I know whether the task is still running.
As an admin, I want agent actions audited so that I can track what the agent accessed.
```

### GitHub

```txt
As an admin, I want to install a GitHub App so that the workspace can access selected repositories.
As a developer, I want GitHub PR events to appear in rooms so that discussions stay connected to code.
As a developer, I want agents to read selected repository files so that they can answer codebase questions.
```

---

## 11. Functional Requirements

## 11.1 Authentication Requirements

| ID       | Requirement                               | Priority |
| -------- | ----------------------------------------- | -------- |
| AUTH-001 | User can sign up with email               | P0       |
| AUTH-002 | User can sign in with email               | P0       |
| AUTH-003 | User can sign in with GitHub              | P0       |
| AUTH-004 | User can log out                          | P0       |
| AUTH-005 | User profile is created after first login | P0       |

---

## 11.2 Workspace Requirements

| ID     | Requirement                  | Priority |
| ------ | ---------------------------- | -------- |
| WS-001 | User can create workspace    | P0       |
| WS-002 | User can update workspace    | P1       |
| WS-003 | User can invite members      | P0       |
| WS-004 | Admin can remove members     | P1       |
| WS-005 | Admin can update member role | P1       |
| WS-006 | User can switch workspace    | P0       |

---

## 11.3 Room Requirements

| ID       | Requirement                       | Priority |
| -------- | --------------------------------- | -------- |
| ROOM-001 | User can create room              | P0       |
| ROOM-002 | User can update room              | P1       |
| ROOM-003 | User can archive room             | P1       |
| ROOM-004 | User can join room                | P0       |
| ROOM-005 | User can leave room               | P1       |
| ROOM-006 | Room can be linked to GitHub repo | P0       |
| ROOM-007 | Room can have assigned agents     | P0       |

---

## 11.4 Message Requirements

| ID      | Requirement                    | Priority |
| ------- | ------------------------------ | -------- |
| MSG-001 | User can send message          | P0       |
| MSG-002 | User can edit own message      | P1       |
| MSG-003 | User can delete own message    | P1       |
| MSG-004 | Messages appear in realtime    | P0       |
| MSG-005 | User can send markdown message | P0       |
| MSG-006 | User can upload attachment     | P1       |
| MSG-007 | User can react to message      | P2       |
| MSG-008 | User can mention user          | P0       |
| MSG-009 | User can mention agent         | P0       |

---

## 11.5 Agent Requirements

| ID        | Requirement                         | Priority |
| --------- | ----------------------------------- | -------- |
| AGENT-001 | User can create agent task          | P0       |
| AGENT-002 | Agent can respond in room           | P0       |
| AGENT-003 | Agent response can stream           | P1       |
| AGENT-004 | Agent run status is visible         | P0       |
| AGENT-005 | User can cancel agent run           | P1       |
| AGENT-006 | Agent can read room context         | P0       |
| AGENT-007 | Agent can read connected repo files | P0       |
| AGENT-008 | Agent actions are logged            | P0       |

---

## 11.6 GitHub Requirements

| ID     | Requirement                        | Priority |
| ------ | ---------------------------------- | -------- |
| GH-001 | Admin can install GitHub App       | P0       |
| GH-002 | Admin can connect repositories     | P0       |
| GH-003 | System can receive GitHub webhooks | P0       |
| GH-004 | GitHub events appear in room       | P0       |
| GH-005 | Agent can read repository metadata | P0       |
| GH-006 | Agent can summarize pull request   | P1       |
| GH-007 | Agent can explain CI failure       | P2       |

---

## 12. Non-Functional Requirements

## 12.1 Performance

| Area                     | Requirement                                    |
| ------------------------ | ---------------------------------------------- |
| Chat message send        | Less than 500ms perceived latency              |
| Room initial load        | Less than 2 seconds for normal room            |
| Agent task creation      | Less than 1 second                             |
| Agent response streaming | First token within reasonable provider latency |
| Search                   | Less than 2 seconds for common queries         |

---

## 12.2 Security

| Area           | Requirement                                       |
| -------------- | ------------------------------------------------- |
| Authentication | Secure session/JWT handling                       |
| Authorization  | Workspace and room-level access checks            |
| GitHub         | Use GitHub App installation tokens                |
| Secrets        | Never expose tokens to frontend                   |
| Agent access   | Agent only accesses allowed resources             |
| Audit          | Log all sensitive actions                         |
| Sandbox        | Code execution must be isolated in later versions |

---

## 12.3 Reliability

| Area      | Requirement                       |
| --------- | --------------------------------- |
| Queue     | Failed jobs can retry             |
| WebSocket | Client can reconnect              |
| Webhook   | Webhook events are idempotent     |
| Agent run | Failed run stores error state     |
| Database  | Migrations are version controlled |

---

## 12.4 Scalability

| Area     | Requirement                                |
| -------- | ------------------------------------------ |
| API      | Stateless API server                       |
| Realtime | Redis adapter for multi-instance WebSocket |
| Queue    | Worker instances can scale horizontally    |
| Database | Use indexed queries and pagination         |
| Messages | Paginated room history                     |

---

## 13. Suggested Architecture

```txt
apps/
  web/
    Next.js frontend

  api/
    NestJS backend API
    WebSocket gateway
    Auth guards
    REST controllers

  worker/
    BullMQ workers
    AI agent task processor
    GitHub webhook processor

packages/
  database/
    Prisma schema
    Prisma client
    migrations

  shared/
    Shared TypeScript types
    DTOs
    constants

  ui/
    Shared UI components

  agent-core/
    Agent prompts
    Agent tools
    Agent state machine

  github-core/
    GitHub App integration
    Octokit helpers
    Webhook event mapping
```

---

## 14. Backend Modules

```txt
AuthModule
UsersModule
WorkspacesModule
MembersModule
RoomsModule
MessagesModule
AgentsModule
AgentRunsModule
GithubModule
NotificationsModule
AuditLogsModule
FilesModule
SearchModule
RealtimeModule
```

---

## 15. Database Design Concept

## 15.1 Main Tables

```txt
users
workspaces
workspace_members
rooms
room_members
messages
message_reactions
agents
agent_runs
agent_run_steps
github_installations
github_repositories
github_pull_requests
github_events
notifications
audit_logs
files
```

---

## 15.2 Example Entity Summary

### users

Stores user account information.

```txt
id
email
name
avatar_url
github_user_id
created_at
updated_at
```

### workspaces

Stores organization/team workspace.

```txt
id
name
slug
avatar_url
created_by
created_at
updated_at
```

### workspace_members

Stores user membership and role.

```txt
id
workspace_id
user_id
role
status
joined_at
created_at
updated_at
```

### rooms

Stores chat rooms.

```txt
id
workspace_id
github_repository_id
name
slug
description
type
status
created_by
created_at
updated_at
```

### messages

Stores room messages.

```txt
id
workspace_id
room_id
sender_type
sender_user_id
sender_agent_id
content
content_type
metadata
created_at
updated_at
deleted_at
```

### agents

Stores available AI agents.

```txt
id
workspace_id
name
description
type
status
model_provider
model_name
system_prompt
created_at
updated_at
```

### agent_runs

Stores long-running AI tasks.

```txt
id
workspace_id
room_id
agent_id
requested_by
source_message_id
status
task_type
input
output
error_message
started_at
completed_at
created_at
updated_at
```

### github_installations

Stores GitHub App installation data.

```txt
id
workspace_id
installation_id
account_login
account_type
status
created_at
updated_at
```

### github_repositories

Stores connected repositories.

```txt
id
workspace_id
installation_id
github_repo_id
owner
name
full_name
private
default_branch
html_url
status
created_at
updated_at
```

### audit_logs

Stores important actions.

```txt
id
workspace_id
actor_type
actor_user_id
actor_agent_id
action
target_type
target_id
metadata
created_at
```

---

## 16. API Design Concept

## 16.1 Auth APIs

```txt
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/github/callback
```

---

## 16.2 Workspace APIs

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

---

## 16.3 Room APIs

```txt
GET    /api/workspaces/:workspaceId/rooms
POST   /api/workspaces/:workspaceId/rooms
GET    /api/workspaces/:workspaceId/rooms/:roomId
PATCH  /api/workspaces/:workspaceId/rooms/:roomId
DELETE /api/workspaces/:workspaceId/rooms/:roomId

POST   /api/workspaces/:workspaceId/rooms/:roomId/members
DELETE /api/workspaces/:workspaceId/rooms/:roomId/members/:memberId
```

---

## 16.4 Message APIs

```txt
GET    /api/workspaces/:workspaceId/rooms/:roomId/messages
POST   /api/workspaces/:workspaceId/rooms/:roomId/messages
PATCH  /api/workspaces/:workspaceId/rooms/:roomId/messages/:messageId
DELETE /api/workspaces/:workspaceId/rooms/:roomId/messages/:messageId
```

---

## 16.5 Agent APIs

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

---

## 16.6 GitHub APIs

```txt
GET  /api/workspaces/:workspaceId/github/installations
GET  /api/workspaces/:workspaceId/github/repositories
POST /api/workspaces/:workspaceId/github/repositories/connect
POST /api/github/webhooks
GET  /api/workspaces/:workspaceId/github/events
```

---

## 16.7 Notification APIs

```txt
GET   /api/notifications
PATCH /api/notifications/:notificationId/read
PATCH /api/notifications/read-all
```

---

## 17. WebSocket Events

## 17.1 Client to Server

```txt
room:join
room:leave
message:send
message:typing:start
message:typing:stop
agent:run:create
agent:run:cancel
```

## 17.2 Server to Client

```txt
message:created
message:updated
message:deleted
message:reaction:created
room:user:joined
room:user:left
room:typing
agent:run:created
agent:run:started
agent:run:step
agent:run:completed
agent:run:failed
github:event:created
notification:created
```

---

## 18. Agent Run Lifecycle

```txt
1. User mentions agent in room
2. API creates message
3. API creates agent_run with status pending
4. API publishes realtime event
5. Worker picks job from BullMQ
6. Worker updates status to running
7. Worker loads room context
8. Worker loads repository context if allowed
9. Worker calls LLM
10. Worker streams partial response
11. Worker stores final output
12. Worker creates agent message
13. Worker marks run as completed
14. Room receives final realtime update
```

---

## 19. UI Pages

## 19.1 Public Pages

```txt
Landing page
Login page
Signup page
GitHub OAuth callback page
```

## 19.2 App Pages

```txt
Workspace switcher
Workspace dashboard
Room list
Room detail/chat page
Agent run detail panel
GitHub integration settings
Repository list
Members settings
Notification center
Audit log page
User profile page
```

---

## 20. Main UI Components

```txt
Sidebar
WorkspaceSwitcher
RoomList
RoomHeader
MessageList
MessageComposer
MessageBubble
AgentMessageBubble
AgentRunStatusCard
GitHubEventCard
MemberAvatarGroup
NotificationDropdown
RepositoryConnectDialog
AgentSelector
CommandMenu
AuditLogTable
```

---

## 21. Message Composer Behavior

### Requirements

* Support normal text.
* Support markdown.
* Support file attachment.
* Support `@user` mention.
* Support `@agent` mention.
* Support slash commands.

### Example Slash Commands

```txt
/ask
/summarize
/review-pr
/explain-repo
/create-plan
/generate-tests
```

---

## 22. Agent Types

## 22.1 MVP Agents

| Agent           | Purpose                                      |
| --------------- | -------------------------------------------- |
| Assistant Agent | General workspace assistant                  |
| Repo Agent      | Answers questions about connected repository |
| PR Agent        | Summarizes and reviews pull requests         |
| Docs Agent      | Generates documentation                      |
| QA Agent        | Generates test cases                         |

---

## 23. Success Metrics

### Product Metrics

```txt
Number of workspaces created
Number of rooms created
Number of GitHub repositories connected
Number of messages sent
Number of agent mentions
Number of completed agent runs
Average agent run completion rate
Daily active users
Weekly active users
```

### Engineering Metrics

```txt
API error rate
WebSocket disconnect rate
Average message latency
Agent task failure rate
Average agent response time
Queue waiting time
Webhook processing success rate
```

### Business Metrics

```txt
Activation rate
Workspace invite conversion rate
Team retention rate
Agent usage per workspace
GitHub connection rate
```

---

## 24. Risks and Mitigation

| Risk                             | Impact | Mitigation                                               |
| -------------------------------- | ------ | -------------------------------------------------------- |
| Agent accesses unauthorized code | High   | Strict permission checks and GitHub installation scoping |
| Agent output is incorrect        | Medium | Show AI disclaimer and require human review              |
| Long-running tasks fail          | Medium | Use BullMQ retries and visible error states              |
| Realtime becomes unstable        | High   | Use Redis adapter and reconnect logic                    |
| GitHub webhook duplicate events  | Medium | Store event delivery ID and enforce idempotency          |
| LLM cost becomes high            | High   | Add usage limits, caching, and model routing             |
| Code execution is unsafe         | High   | Start read-only, later use isolated sandbox              |
| Product scope becomes too large  | High   | Keep MVP read-only for agents                            |

---

## 25. Milestone Plan

## Milestone 1: Foundation

```txt
Set up monorepo
Set up Next.js frontend
Set up NestJS backend
Set up Neon Postgres
Set up Prisma schema
Set up authentication
Set up workspace module
Set up member module
```

## Milestone 2: Rooms and Chat

```txt
Create room module
Create message module
Add WebSocket gateway
Implement realtime room join/leave
Implement send message
Implement message history
Implement typing indicator
```

## Milestone 3: AI Agent MVP

```txt
Create agent module
Create agent run module
Set up BullMQ
Create worker app
Implement @agent mention
Implement basic agent response
Stream agent response to room
Store agent run history
```

## Milestone 4: GitHub Integration

```txt
Create GitHub App
Install GitHub App flow
Store installation data
Connect repositories
Receive webhooks
Display GitHub events in room
Allow agent to read repository metadata
```

## Milestone 5: Repository-Aware Agent

```txt
Agent can list repository files
Agent can read selected files
Agent can search repository
Agent can summarize repository
Agent can answer codebase questions
Audit repository reads
```

## Milestone 6: Product Polish

```txt
Notification center
Audit log page
Room settings
Agent settings
Loading states
Error states
Empty states
Permission polish
Deployment setup
```

---

## 26. MVP Acceptance Criteria

The MVP is considered complete when:

```txt
1. User can sign in.
2. User can create workspace.
3. User can invite members.
4. User can create room.
5. Users can chat in realtime.
6. User can mention AI agent.
7. Agent can respond in room.
8. Agent task status is visible.
9. User can connect GitHub repository.
10. GitHub events appear in linked room.
11. Agent can answer basic questions about connected repository.
12. Agent actions are logged.
13. Admin can view audit logs.
14. Product can be deployed and used by a small test team.
```

---

## 27. Recommended Implementation Priority

Build in this order:

```txt
1. Auth
2. Workspace
3. Room
4. Message
5. WebSocket realtime
6. Agent basic response
7. BullMQ background job
8. GitHub App installation
9. Repository connection
10. GitHub webhooks
11. Repository-aware agent
12. Audit logs
13. Notifications
14. Deployment
```

---

## 28. Final Technical Recommendation

Use a modular monolith first.

```txt
Next.js handles the frontend.
NestJS handles API, auth guards, business logic, and WebSocket.
Neon Postgres stores main product data.
Redis supports queue, realtime scaling, presence, and temporary state.
BullMQ handles long-running agent jobs.
GitHub App handles repository access.
Worker app handles AI agent execution.
```

Do not split into microservices at the beginning. The first version should be simple, maintainable, and fast to develop. Split later only when the agent runner, sandbox execution, or realtime infrastructure needs independent scaling.
