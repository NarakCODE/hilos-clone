-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('GENERAL', 'REPOSITORY', 'PULL_REQUEST', 'AGENT_TASK');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'MARKDOWN', 'SYSTEM', 'AGENT', 'GITHUB_EVENT', 'AGENT_RUN');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MENTION', 'AGENT_RUN', 'INVITE', 'GITHUB');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "githubUserId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "invitedEmail" TEXT,
    "role" "WorkspaceRole" NOT NULL,
    "status" "MemberStatus" NOT NULL,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMPTZ(6),
    "joinedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "githubRepositoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "RoomType" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAgent" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "RoomAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderUserId" TEXT,
    "senderAgentId" TEXT,
    "content" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "metadata" JSONB,
    "editedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageMention" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "mentionedType" "SenderType" NOT NULL,
    "mentionedId" TEXT NOT NULL,

    CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'PENDING',
    "taskType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRunStep" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRunStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubInstallation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GithubInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubRepository" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "htmlUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GithubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "action" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "metadata" JSONB,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorUserId" TEXT,
    "actorAgentId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubUserId_key" ON "User"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_inviteToken_key" ON "WorkspaceMember"("inviteToken");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_status_idx" ON "WorkspaceMember"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Room_workspaceId_status_idx" ON "Room"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Room_workspaceId_slug_key" ON "Room"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAgent_roomId_agentId_key" ON "RoomAgent"("roomId", "agentId");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageMention_messageId_idx" ON "MessageMention"("messageId");

-- CreateIndex
CREATE INDEX "AgentRun_roomId_status_idx" ON "AgentRun"("roomId", "status");

-- CreateIndex
CREATE INDEX "AgentRunStep_agentRunId_sequence_idx" ON "AgentRunStep"("agentRunId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "GithubInstallation_installationId_key" ON "GithubInstallation"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepository_workspaceId_githubRepoId_key" ON "GithubRepository"("workspaceId", "githubRepoId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubEvent_deliveryId_key" ON "GithubEvent"("deliveryId");

-- CreateIndex
CREATE INDEX "GithubEvent_repositoryId_createdAt_idx" ON "GithubEvent"("repositoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex (partial unique)
-- Prevents duplicate *pending* invitations for the same email within a workspace
-- (Req 3.3). Prisma cannot express partial unique indexes natively, so this is
-- added as raw SQL. It only applies to rows whose status is 'PENDING', allowing
-- an email to be re-invited after a prior invite is accepted/removed and not
-- conflicting with the @@unique([workspaceId, userId]) constraint for active
-- members.
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_invitedEmail_pending_key"
    ON "WorkspaceMember" ("workspaceId", "invitedEmail")
    WHERE "status" = 'PENDING';
