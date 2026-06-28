# Requirements Document

## Introduction

The AI Collaboration Workspace is a web-based platform where software teams create workspaces, join rooms, connect GitHub repositories, and collaborate with AI agents inside shared chat rooms. The product behaves like a team chat platform, but AI coding agents are first-class participants that can read repository context, answer questions, summarize discussion and pull requests, and run controlled background tasks.

This document defines the requirements for MVP Version 1. The MVP focuses on collaboration, realtime chat, GitHub connection, and read-only AI agent assistance. It covers the following capabilities: email and GitHub authentication, workspace creation, member invitation, room creation, realtime room chat, AI agent mention and response, GitHub App installation, connecting a repository to a room, GitHub webhook event display, read-only repository context for agents, an agent task queue, agent run status, basic audit logs, and a basic notification center.

The following Version 2 capabilities are explicitly out of scope for this document: agent code editing, agent branch creation, agent pull request creation, billing, enterprise SSO, mobile native apps, advanced analytics, and an agent marketplace.

Requirements are written to remain implementation-agnostic where possible. The recommended technical direction (Next.js frontend, NestJS backend, Postgres, Redis, BullMQ, GitHub App) is contextual and does not constrain these requirements.

## Glossary

- **Platform**: The complete AI Collaboration Workspace system.
- **Auth_Service**: The component responsible for user sign-up, sign-in, session handling, and logout.
- **Workspace_Service**: The component that manages workspaces, including creation, update, and workspace switching.
- **Membership_Service**: The component that manages workspace members, invitations, roles, and removal.
- **Room_Service**: The component that manages rooms, including creation, update, archival, membership, repository links, and agent assignment.
- **Messaging_Service**: The component that manages room messages, including creation, edit, delete, markdown rendering, and mentions.
- **Realtime_Service**: The component that delivers realtime events such as new messages, presence, typing, and agent run updates to connected clients.
- **Agent_Service**: The component that handles agent mentions, creates agent runs, and posts agent responses into rooms.
- **Agent_Runner**: The background worker component that processes queued agent runs, updates run status, loads context, calls the language model, and posts results.
- **GitHub_Service**: The component that manages GitHub App installation, repository connection, repository metadata, and pull request metadata.
- **Webhook_Processor**: The component that receives, verifies, and processes GitHub webhook events.
- **Repository_Context_Reader**: The component that allows agents to list, read, and search connected repository files in read-only mode.
- **Notification_Service**: The component that creates, lists, and updates user notifications.
- **Audit_Service**: The component that records sensitive and important actions as audit log entries.
- **User**: A human account holder on the Platform.
- **Owner**: The workspace creator, who has full workspace access.
- **Admin**: A workspace manager who can manage members, rooms, GitHub repositories, and agents.
- **Member**: A normal workspace user who can join rooms, send messages, and trigger allowed agent tasks.
- **Guest**: A limited user who can access only the rooms they are invited to.
- **Agent**: An AI participant in a room that can respond and execute allowed read-only tools based on permissions.
- **Workspace**: A team, organization, or project group that contains members, rooms, agents, and GitHub connections.
- **Room**: A chat space inside a workspace where Users and Agents collaborate.
- **Message**: A unit of communication posted in a Room.
- **Agent_Run**: A stored record of an AI task created from a Room, processed in a background queue, with a lifecycle status.
- **Agent_Run_Status**: The lifecycle state of an Agent_Run, one of: pending, running, completed, failed, cancelled.
- **GitHub_App**: The GitHub App installation that grants the Workspace scoped access to selected repositories.
- **GitHub_Event**: A webhook event received from GitHub, such as push, pull_request, issues, issue_comment, pull_request_review, check_run, or check_suite.
- **Connected_Repository**: A GitHub repository that has been connected to a Workspace through the GitHub_App.
- **Audit_Log_Entry**: A record of a sensitive action containing actor, action, target, timestamp, and metadata.
- **Notification**: A record informing a User of a mention, agent completion, workspace invitation, or GitHub update.

## Requirements

### Requirement 1: Email and GitHub Authentication

**User Story:** As a user, I want to sign in with email or GitHub, so that I can access the product and connect my repositories.

#### Acceptance Criteria

1. WHEN a User submits sign-up details with an email matching the format local-part@domain and a password between 8 and 128 characters inclusive, THE Auth_Service SHALL create a User account and establish an authenticated session within 5 seconds.
2. IF a User submits sign-up details with an email that does not match the format local-part@domain or a password shorter than 8 characters or longer than 128 characters, THEN THE Auth_Service SHALL reject the sign-up, return a validation error message indicating which field is invalid, and SHALL NOT create a User account.
3. IF a User submits sign-up details with an email that matches an existing stored account, THEN THE Auth_Service SHALL reject the sign-up, return an error message indicating the email is already registered, and SHALL NOT create a duplicate User account.
4. WHEN a User submits sign-in credentials with an email and password that match a stored account, THE Auth_Service SHALL establish an authenticated session and grant access to the dashboard within 5 seconds.
5. IF a User submits sign-in credentials that do not match a stored account, THEN THE Auth_Service SHALL reject the sign-in and return an authentication error message that does not disclose which credential field was incorrect.
6. WHEN a User completes GitHub OAuth authorization, THE Auth_Service SHALL establish an authenticated session within 5 seconds and link the User account to the GitHub identity.
7. IF GitHub OAuth authorization fails or is denied by the User, THEN THE Auth_Service SHALL reject the authentication, return an error message indicating the GitHub authorization was not completed, and SHALL NOT establish an authenticated session.
8. WHEN a User authenticates for the first time, THE Auth_Service SHALL create a User profile containing the User identifier, email, and display name.
9. WHEN an authenticated User requests to log out, THE Auth_Service SHALL terminate the active session.
10. IF an unauthenticated request targets a protected resource, THEN THE Auth_Service SHALL deny access and return an authentication-required response.

### Requirement 2: Workspace Creation and Switching

**User Story:** As a user, I want to create a workspace and switch between workspaces, so that my team can collaborate in a dedicated space.

#### Acceptance Criteria

1. WHEN an authenticated User submits a workspace name containing between 1 and 100 characters, THE Workspace_Service SHALL create a Workspace and assign the creating User the Owner role.
2. IF an authenticated User submits a workspace name that is empty, exceeds 100 characters, or contains only whitespace, THEN THE Workspace_Service SHALL deny the request, return a validation error indicating the name is invalid, and create no Workspace.
3. WHEN a Workspace is created, THE Workspace_Service SHALL generate a workspace slug that is unique across all existing Workspaces.
4. WHERE the requesting User holds the Owner or Admin role, THE Workspace_Service SHALL allow updating the workspace name and avatar.
5. IF a User who holds the Member or Guest role requests to update workspace settings, THEN THE Workspace_Service SHALL deny the request, retain the existing workspace settings unchanged, and return an authorization error.
6. WHEN an authenticated User requests the list of workspaces, THE Workspace_Service SHALL return only the Workspaces in which the User holds membership.
7. WHEN an authenticated User selects a Workspace they are a member of, THE Workspace_Service SHALL switch the active Workspace context to the selected Workspace.
8. IF an authenticated User selects a Workspace they are not a member of, THEN THE Workspace_Service SHALL deny the request, leave the active Workspace context unchanged, and return an authorization error.

### Requirement 3: Member Invitation and Role Management

**User Story:** As an admin, I want to invite members and manage their roles, so that teammates can join the workspace with controlled permissions.

#### Acceptance Criteria

1. WHERE the requesting User holds the Owner or Admin role, WHEN the User submits a member invitation containing a syntactically valid email address (1 to 254 characters, conforming to standard email format) and one of the assignable roles Owner, Admin, Member, or Guest, THE Membership_Service SHALL create the invitation for that email address.
2. IF a member invitation is submitted with an email address that is empty, exceeds 254 characters, or does not conform to standard email format, THEN THE Membership_Service SHALL reject the request, return an error indicating the email address is invalid, and create no workspace member entry.
3. IF a member invitation is submitted for an email address that already has an active or pending workspace member entry, THEN THE Membership_Service SHALL reject the request, return an error indicating the member already exists or is already invited, and create no additional workspace member entry.
4. WHEN an invitation is created, THE Membership_Service SHALL record a workspace member entry with a pending status for the invited email and set the invitation to expire 7 days (168 hours) after creation.
5. WHEN an invited User accepts an invitation that is in pending status and has not reached its expiration time, THE Membership_Service SHALL set the workspace member status to active and assign the invited role.
6. IF an invited User attempts to accept an invitation that is expired, already accepted, or not found, THEN THE Membership_Service SHALL reject the request, return an error indicating the invitation is no longer valid, and leave the workspace member status unchanged.
7. WHERE the requesting User holds the Owner or Admin role, THE Membership_Service SHALL allow updating the role of an existing Member to one of Owner, Admin, Member, or Guest.
8. IF a request to update a Member's role or to remove a Member would leave the Workspace with zero Users holding the Owner role, THEN THE Membership_Service SHALL reject the request, return an error indicating at least one Owner must remain, and leave the affected Member's role and status unchanged.
9. WHERE the requesting User holds the Owner or Admin role, THE Membership_Service SHALL allow removing a Member from the Workspace.
10. IF a User who holds the Member or Guest role requests to invite, remove, or change the role of a member, THEN THE Membership_Service SHALL deny the request and return an error indicating insufficient permissions.
11. WHEN a Member is removed from a Workspace, THE Membership_Service SHALL set that Member's workspace member status to removed and revoke that Member's access to the Workspace and its Rooms.

### Requirement 4: Room Creation and Management

**User Story:** As a member, I want to create and manage rooms, so that I can organize discussion around projects and topics.

#### Acceptance Criteria

1. WHEN a Workspace member submits a room name between 1 and 100 characters, THE Room_Service SHALL create a Room within the active Workspace and add the creating User as a Room member.
2. IF a Workspace member submits a room name that is empty or exceeds 100 characters, THEN THE Room_Service SHALL reject the creation, retain no new Room, and return an error indication that the room name is invalid.
3. WHEN a Room is created, THE Room_Service SHALL assign the Room exactly one type from the set {General Room, Repository Room, Pull Request Room, Agent Task Room}.
4. WHERE the requesting User is a Room member with the Owner, Admin, or Member role, THE Room_Service SHALL allow updating the Room name to a value between 1 and 100 characters and the Room description to a value between 0 and 500 characters.
5. IF a User who is not a Room member with the Owner, Admin, or Member role requests to update a Room name or description, THEN THE Room_Service SHALL reject the update, retain the existing Room name and description unchanged, and return an error indication that the update is not authorized.
6. IF a request to update a Room name or description supplies a name outside 1 to 100 characters or a description exceeding 500 characters, THEN THE Room_Service SHALL reject the update, retain the existing values unchanged, and return an error indication that the input is invalid.
7. WHEN a Workspace member requests to join an existing non-archived Room in the active Workspace, THE Room_Service SHALL add the User as a Room member.
8. IF a Workspace member requests to join an archived Room, THEN THE Room_Service SHALL reject the request, leave the Room membership unchanged, and return an error indication that the Room is archived.
9. WHEN a Room member requests to leave a Room, THE Room_Service SHALL remove the User from the Room membership.
10. WHEN a User requests to view a Room they are not a member of, THE Room_Service SHALL deny access to the Room messages and return an error indication that access is denied.
11. WHEN a Room is archived, THE Room_Service SHALL set the Room to read-only.
12. IF a User submits a new message to an archived read-only Room, THEN THE Room_Service SHALL reject the message, persist no new message, and return an error indication that the Room is read-only.
13. WHERE a Room is linked to a Connected_Repository, THE Room_Service SHALL display the linked repository metadata in the Room.

### Requirement 5: Realtime Room Chat

**User Story:** As a member, I want to send messages that appear in realtime, so that team discussion is fast and stays in sync.

#### Acceptance Criteria

1. WHEN a Room member submits a text message containing 1 to 4000 characters to a non-archived Room, THE Messaging_Service SHALL store the Message and associate it with the Room and the sending User.
2. WHEN a Room member submits a message containing markdown within the 4000-character limit, THE Messaging_Service SHALL store the markdown content with a markdown content type.
3. WHEN a Message is created in a Room, THE Realtime_Service SHALL deliver the new Message to all connected Room members within 2 seconds without requiring a page refresh.
4. WHEN a Room member edits a Message they sent, THE Messaging_Service SHALL update the Message content, mark the Message as edited, and deliver the updated Message to connected Room members within 2 seconds.
5. IF a User requests to edit or delete a Message they did not send, THEN THE Messaging_Service SHALL deny the request and return an authorization error, leaving the Message unchanged.
6. WHEN a Room member deletes a Message they sent, THE Messaging_Service SHALL mark the Message as deleted and deliver the deletion to connected Room members within 2 seconds.
7. WHEN a User opens a Room, THE Messaging_Service SHALL return the Room message history in reverse chronological order in pages of up to 50 Messages.
8. WHEN a Room member submits a Message containing one or more at-mention references to other Room members, THE Messaging_Service SHALL record each mentioned User reference on the Message.
9. WHEN a connected client loses and re-establishes its realtime connection, THE Realtime_Service SHALL allow the client to rejoin the Room and resume receiving events.
10. IF a Room member submits a message that is empty or exceeds 4000 characters, THEN THE Messaging_Service SHALL reject the message and return a validation error, without storing the Message.
11. IF a User submits a message to an archived Room, THEN THE Messaging_Service SHALL reject the message and return an error indicating the Room is archived, without storing the Message.

### Requirement 6: AI Agent Mention and Response

**User Story:** As a developer, I want to mention an AI agent in a room, so that it can respond to my request with relevant context.

#### Acceptance Criteria

1. WHEN a Room member mentions an Agent assigned to the Room, THE Agent_Service SHALL create exactly one Agent_Run with status pending, record the identifier of the source Message, and associate the Agent_Run with the originating Room.
2. WHEN an Agent_Run is created, THE Agent_Service SHALL publish within 2 seconds a realtime event to all connected Room members indicating that an agent task has started for that Agent_Run.
3. WHEN the Agent_Runner completes an Agent_Run successfully, THE Agent_Service SHALL post the Agent response as a single Message in the originating Room, labeled as AI-generated, and SHALL set the Agent_Run status to completed.
4. WHILE an Agent_Run holds the running status, THE Realtime_Service SHALL display a running indicator for that Agent_Run to all connected Room members, and SHALL remove the indicator within 2 seconds of the Agent_Run leaving the running status.
5. IF a Room member mentions an Agent that is not assigned to the Room, THEN THE Agent_Service SHALL reject the request without creating an Agent_Run and SHALL return an error indicating the Agent is unavailable.
6. WHEN the Agent_Runner loads context for an Agent_Run, THE Agent_Runner SHALL restrict access to data within the Workspace and Rooms the requesting User can access.
7. IF the Agent_Runner fails to complete an Agent_Run, THEN THE Agent_Service SHALL set the Agent_Run status to failed, SHALL NOT post an AI-generated response Message, and SHALL publish a realtime event to connected Room members indicating the agent task failed.
8. IF an Agent_Run remains in the running status for more than 120 seconds, THEN THE Agent_Service SHALL terminate the Agent_Run, set its status to failed, and notify connected Room members that the agent task did not complete.

### Requirement 7: Agent Task Queue and Run Status

**User Story:** As a tech lead, I want agent tasks to run in the background with visible status, so that long-running work does not block the UI and I can track progress.

#### Acceptance Criteria

1. WHEN an Agent_Run is created, THE Agent_Service SHALL enqueue the Agent_Run for background processing, set its Agent_Run_Status to pending, and return an acknowledgment to the user interface within 1 second without waiting for processing to complete.
2. WHEN the Agent_Runner begins processing an Agent_Run, THE Agent_Runner SHALL update the Agent_Run_Status from pending to running.
3. WHILE the Agent_Runner processes an Agent_Run, THE Agent_Runner SHALL record step-by-step progress entries for the Agent_Run, retaining up to a maximum of 500 entries per Agent_Run in chronological order.
4. WHEN the Agent_Runner finishes an Agent_Run successfully, THE Agent_Runner SHALL set the Agent_Run_Status to completed and store the output up to a maximum of 1,000,000 characters.
5. IF the Agent_Runner encounters an error while processing an Agent_Run, THEN THE Agent_Runner SHALL set the Agent_Run_Status to failed and store an error reason indicating the cause of failure.
6. WHEN the User who created an Agent_Run requests to cancel it WHILE its Agent_Run_Status is pending or running, THE Agent_Service SHALL set the Agent_Run_Status to cancelled and stop further processing of that Agent_Run.
7. IF a User who did not create an Agent_Run requests to cancel it, THEN THE Agent_Service SHALL reject the request, return a response indicating the user is not authorized, and leave the Agent_Run_Status unchanged.
8. IF a User requests to cancel an Agent_Run WHILE its Agent_Run_Status is completed, failed, or cancelled, THEN THE Agent_Service SHALL reject the request, return a response indicating the run is no longer cancellable, and leave the Agent_Run_Status unchanged.
9. WHEN a User opens a Room containing a previously created Agent_Run, THE Agent_Service SHALL return the current Agent_Run_Status and any stored output.
10. WHEN an Agent_Run transitions to completed, failed, or cancelled, THE Realtime_Service SHALL deliver the status transition to connected Room members within 2 seconds of the transition.

### Requirement 8: GitHub App Installation

**User Story:** As an admin, I want to install a GitHub App, so that the workspace can access selected repositories securely.

#### Acceptance Criteria

1. WHERE the requesting User holds the Owner or Admin role, THE GitHub_Service SHALL allow initiating GitHub App installation for the active Workspace.
2. WHEN a GitHub App installation completes successfully, THE GitHub_Service SHALL store the installation metadata, including the installation identifier, account login, and account type, associated with the Workspace, and SHALL mark the installation status as Active.
3. IF a GitHub App installation fails to complete or returns no installation identifier, THEN THE GitHub_Service SHALL discard any partial metadata, leave the Workspace without an active installation, and return an error indicating that installation did not complete.
4. IF a User who holds the Member or Guest role requests to install or manage the GitHub App, THEN THE GitHub_Service SHALL deny the request, make no change to existing installation metadata, and return an authorization error indicating insufficient role.
5. THE GitHub_Service SHALL store GitHub access credentials such that they are never included in any response sent to the frontend client.
6. WHEN a Workspace member views GitHub integration settings, THE GitHub_Service SHALL display the installation status as Active, including the account login and account type, when an installation exists for the Workspace, and SHALL display a Not Installed status when no installation exists.

### Requirement 9: Connect Repository to Room

**User Story:** As a member, I want to connect a GitHub repository to a room, so that the room has repository context for discussion and agents.

#### Acceptance Criteria

1. WHERE the requesting User holds the Owner or Admin role AND the Workspace has a GitHub App installation in the active state, THE GitHub_Service SHALL allow the User to connect any repository that the installation can access.
2. WHEN a repository is connected, THE GitHub_Service SHALL store the repository metadata, including owner, name, full name, default branch, and visibility, as a Connected_Repository associated with the Workspace.
3. WHEN a Workspace member opens GitHub integration settings, THE GitHub_Service SHALL display the list of Connected_Repositories for the Workspace, including each repository's full name, default branch, and visibility.
4. WHERE a Room member with the Owner, Admin, or Member role selects a Connected_Repository, THE Room_Service SHALL link the Connected_Repository to the Room and make the link visible in the Room's repository context.
5. IF a User requests to connect a repository that is not accessible to the Workspace GitHub App installation, THEN THE GitHub_Service SHALL reject the request, persist no Connected_Repository record, and return an error indicating the repository is not accessible to the installation.
6. IF a User without the Owner or Admin role requests to connect a repository, THEN THE GitHub_Service SHALL reject the request, persist no Connected_Repository record, and return an error indicating insufficient permissions.
7. IF a User requests to connect a repository that is already stored as a Connected_Repository for the Workspace, THEN THE GitHub_Service SHALL reject the request, retain the existing Connected_Repository record unchanged, and return an error indicating the repository is already connected.

### Requirement 10: GitHub Webhook Event Display

**User Story:** As a developer, I want GitHub events to appear in rooms, so that discussions stay connected to code activity.

#### Acceptance Criteria

1. WHEN the Webhook_Processor receives a GitHub webhook request, THE Webhook_Processor SHALL verify the webhook signature before processing the payload.
2. IF a received webhook request fails signature verification, THEN THE Webhook_Processor SHALL reject the request, return a response indicating signature verification failure, and SHALL NOT store the payload or any data derived from it.
3. IF the Webhook_Processor receives a verified GitHub webhook request that targets a repository that is not a Connected_Repository, THEN THE Webhook_Processor SHALL discard the request without storing the GitHub_Event or altering any stored state.
4. WHEN the Webhook_Processor processes a verified GitHub_Event for a Connected_Repository, THE Webhook_Processor SHALL store the GitHub_Event associated with the Workspace and Connected_Repository.
5. WHEN a GitHub_Event is stored for a Connected_Repository that is linked to one or more Rooms, THE GitHub_Service SHALL post the GitHub_Event as a message of type GitHub Event into each linked Room.
6. WHEN a GitHub_Event is stored for a Connected_Repository that is not linked to any Room, THE GitHub_Service SHALL retain the stored GitHub_Event and SHALL NOT post it to any Room.
7. WHEN a GitHub_Event is posted to a Room, THE Realtime_Service SHALL deliver the GitHub_Event to connected Room members within 5 seconds of the GitHub_Event being posted.
8. IF the Webhook_Processor receives a GitHub_Event with a delivery identifier that has already been processed, THEN THE Webhook_Processor SHALL ignore the duplicate event and SHALL preserve the previously stored GitHub_Event data unchanged so that processing is idempotent.

### Requirement 11: Read-Only Repository Context for Agent

**User Story:** As a developer, I want agents to read selected repository files, so that they can answer codebase questions accurately.

#### Acceptance Criteria

1. WHEN an Agent requests repository content during an Agent_Run, THE Repository_Context_Reader SHALL provide access only to repositories connected to the Agent's Workspace.
2. WHEN an Agent lists files within a Connected_Repository, THE Repository_Context_Reader SHALL return up to 1,000 file entries per list request.
3. WHEN an Agent searches code within a Connected_Repository, THE Repository_Context_Reader SHALL return up to 100 search matches per search request.
4. WHEN an Agent reads a selected file within a Connected_Repository, THE Repository_Context_Reader SHALL return the file content for files up to 5 MB in size.
5. THE Repository_Context_Reader SHALL restrict Agent repository operations to read-only access.
6. IF an Agent requests a write, branch, commit, or pull request operation, THEN THE Repository_Context_Reader SHALL reject the operation, return an error indicating that the operation is not permitted under read-only access, and leave the repository state unchanged.
7. WHEN an Agent reads a repository file through the Repository_Context_Reader, THE Audit_Service SHALL record an Audit_Log_Entry containing the Agent ID, the repository ID, the file path, and the timestamp of the read action.
8. IF an Agent requests content from a repository that is not connected to the Agent's Workspace, THEN THE Repository_Context_Reader SHALL deny the request, return an access error, and return no repository content.
9. IF an Agent requests a file that does not exist or exceeds the 5 MB read limit, THEN THE Repository_Context_Reader SHALL reject the read request, return an error indicating the file is unavailable or too large, and return no file content.
10. IF a Connected_Repository is unavailable when an Agent requests its content, THEN THE Repository_Context_Reader SHALL deny the request and return an error indicating the repository is unavailable.

### Requirement 12: Basic Audit Logs

**User Story:** As an admin, I want sensitive actions recorded in an audit log, so that I can track what users and agents did.

#### Acceptance Criteria

1. WHEN a Workspace is created, a member is invited, a member role is changed, a GitHub App is connected, a repository is connected, an Agent_Run is created, or an Agent reads a repository file, THE Audit_Service SHALL record one Audit_Log_Entry corresponding to that action within 5 seconds of the action completing.
2. THE Audit_Service SHALL record each Audit_Log_Entry with actor identifier, actor type, action name, target identifier, a timestamp in UTC using ISO 8601 format, and a metadata field containing the contextual attributes of the action.
3. WHEN an action is performed by an Agent, THE Audit_Service SHALL record the actor type of the Audit_Log_Entry as agent, and WHEN an action is performed by a User, THE Audit_Service SHALL record the actor type as user.
4. WHEN a User who holds the Owner or Admin role requests the audit log for a Workspace, THE Audit_Service SHALL return the list of Audit_Log_Entries for that Workspace ordered by timestamp from newest to oldest, in pages of at most 100 entries per request.
5. IF a User who holds the Member or Guest role requests the audit log, THEN THE Audit_Service SHALL deny the request, return no Audit_Log_Entries, and return an authorization error indicating the requester lacks the required role.
6. IF recording an Audit_Log_Entry fails, THEN THE Audit_Service SHALL retry recording up to 3 times and, if all attempts fail, return an error indicating the audit entry could not be recorded without altering the outcome of the originating action.

### Requirement 13: Basic Notification Center

**User Story:** As a user, I want to receive notifications for mentions, agent completions, and invitations, so that I stay aware of relevant activity.

#### Acceptance Criteria

1. WHEN a User is mentioned in a Message by another User, THE Notification_Service SHALL create a Notification for the mentioned User within 5 seconds.
2. IF a User is mentioned in a Message authored by that same User, THEN THE Notification_Service SHALL NOT create a Notification for that User and SHALL leave that User's unread count unchanged.
3. WHEN an Agent_Run created by a User transitions to completed or failed, THE Notification_Service SHALL create a Notification for the requesting User within 5 seconds.
4. WHEN a User is invited to a Workspace, THE Notification_Service SHALL create a Notification for the invited User within 5 seconds.
5. WHEN a GitHub_Event of type pull_request opened or merged is posted to a Room, THE Notification_Service SHALL create a Notification within 5 seconds for each Room member excluding the User who triggered the GitHub_Event.
6. WHEN an authenticated User requests their notifications, THE Notification_Service SHALL return the list of Notifications owned by that User, ordered from newest to oldest, with a maximum of 50 Notifications per page.
7. IF an authenticated User requests Notifications owned by a different User, THEN THE Notification_Service SHALL reject the request, return an error indicating access is not permitted, and SHALL NOT return any Notification belonging to the other User.
8. WHEN a User marks a Notification that they own as read, THE Notification_Service SHALL set the Notification status to read within 5 seconds and SHALL exclude that Notification from the User's unread count.
9. IF a User attempts to mark a Notification as read that does not exist or that the User does not own, THEN THE Notification_Service SHALL reject the request, return an error indicating the Notification is not found or not permitted, and SHALL preserve the existing status of any such Notification.

### Requirement 14: Access Control and Performance

**User Story:** As a workspace admin, I want access enforced at workspace and room level with responsive interactions, so that data stays protected and the product feels fast.

#### Acceptance Criteria

1. WHEN a User requests any Workspace resource, THE Platform SHALL verify the User holds active membership in the Workspace before returning the resource.
2. IF a User requests a Workspace resource for a Workspace in which the User does not hold active membership, THEN THE Platform SHALL deny the request, return no Workspace data, and return an authorization error.
3. WHEN a User requests any Room resource, THE Platform SHALL verify the User holds active membership in the Room before returning the resource.
4. IF a User requests a Room resource for a Room in which the User does not hold active membership, THEN THE Platform SHALL deny the request, return no Room data, and return an authorization error.
5. WHEN a Room member sends a text Message, THE Messaging_Service SHALL return a delivery acknowledgment within 500 milliseconds, measured at the 95th percentile, with up to 100 concurrent active Users.
6. WHEN a User opens a Room containing 50 or fewer members, THE Platform SHALL load the initial Room view, including the 50 most recent Messages, within 2 seconds with up to 100 concurrent active Users.
7. WHEN a User creates an Agent_Run, THE Agent_Service SHALL acknowledge creation within 1 second, measured at the 95th percentile, with up to 100 concurrent active Users.
