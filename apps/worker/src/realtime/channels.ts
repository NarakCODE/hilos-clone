/**
 * Redis pub/sub channel + event conventions for realtime fan-out.
 *
 * The worker never talks to clients directly: it publishes events to Redis
 * pub/sub channels, and the API instances (subscribed via the socket.io Redis
 * adapter) relay them to the WebSocket clients that have joined the relevant
 * room (design "Realtime delivered over WebSocket ... through a Redis adapter").
 */

/** Prefix for all realtime pub/sub channels. */
export const REALTIME_CHANNEL_PREFIX = "realtime";

/** Channel carrying events scoped to a single room. */
export function roomChannel(roomId: string): string {
  return `${REALTIME_CHANNEL_PREFIX}:room:${roomId}`;
}

/** Channel carrying events scoped to a whole workspace (e.g. notifications). */
export function workspaceChannel(workspaceId: string): string {
  return `${REALTIME_CHANNEL_PREFIX}:workspace:${workspaceId}`;
}

/**
 * Server-to-client realtime event names (design "WebSocket Events"). The worker
 * emits the agent-run lifecycle and github event names; the API emits the
 * message/room/notification names. Centralized here so both sides agree.
 */
export const REALTIME_EVENTS = {
  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  ROOM_USER_JOINED: "room:user:joined",
  ROOM_USER_LEFT: "room:user:left",
  ROOM_TYPING: "room:typing",
  AGENT_RUN_CREATED: "agent:run:created",
  AGENT_RUN_STARTED: "agent:run:started",
  AGENT_RUN_STEP: "agent:run:step",
  AGENT_RUN_COMPLETED: "agent:run:completed",
  AGENT_RUN_FAILED: "agent:run:failed",
  GITHUB_EVENT_CREATED: "github:event:created",
  NOTIFICATION_CREATED: "notification:created",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Envelope published to a realtime channel. Each event carries `workspaceId`,
 * `roomId` (when applicable), and the affected entity in `data`
 * (design "Each event payload carries workspaceId, roomId ... and the affected
 * entity").
 */
export interface RealtimeEvent<TData = unknown> {
  readonly event: RealtimeEventName;
  readonly workspaceId: string;
  readonly roomId?: string;
  readonly data: TData;
}
