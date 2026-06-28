import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from "@nestjs/common";
import IORedis, { type Redis } from "ioredis";
import { WORKER_CONFIG, type WorkerConfig } from "../config/worker-config";
import {
  roomChannel,
  workspaceChannel,
  type RealtimeEvent,
  type RealtimeEventName,
} from "./channels";

/**
 * Publishes realtime events to Redis pub/sub channels.
 *
 * The worker emits agent-run lifecycle and github events here after the
 * relevant database writes commit; the API's socket.io Redis adapter consumes
 * them and fans them out to the WebSocket clients in the matching room. This
 * keeps the worker decoupled from client connections (design: "The worker never
 * talks to clients directly. It publishes events to Redis pub/sub").
 *
 * A dedicated publisher connection is used (separate from the BullMQ queue
 * connections) per Redis pub/sub guidance.
 */
@Injectable()
export class RealtimePublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimePublisher.name);
  private readonly publisher: Redis;

  constructor(@Inject(WORKER_CONFIG) config: WorkerConfig) {
    this.publisher = new IORedis(config.redisConnection);
  }

  /** Publish a fully-formed event to the appropriate channel. */
  async publish(event: RealtimeEvent): Promise<void> {
    const channel = event.roomId
      ? roomChannel(event.roomId)
      : workspaceChannel(event.workspaceId);
    await this.publishTo(channel, event);
  }

  /** Publish a room-scoped event (`message:*`, `agent:run:*`, `github:*`). */
  async publishToRoom(
    roomId: string,
    workspaceId: string,
    eventName: RealtimeEventName,
    data: unknown,
  ): Promise<void> {
    await this.publishTo(roomChannel(roomId), {
      event: eventName,
      workspaceId,
      roomId,
      data,
    });
  }

  /** Publish a workspace-scoped event (e.g. `notification:created`). */
  async publishToWorkspace(
    workspaceId: string,
    eventName: RealtimeEventName,
    data: unknown,
  ): Promise<void> {
    await this.publishTo(workspaceChannel(workspaceId), {
      event: eventName,
      workspaceId,
      data,
    });
  }

  private async publishTo(
    channel: string,
    event: RealtimeEvent,
  ): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(event));
    } catch (err) {
      // Realtime delivery is best-effort; the authoritative state is in
      // Postgres and clients reconcile on (re)load. Never let a publish
      // failure break the originating job.
      this.logger.warn(
        `Failed to publish ${event.event} to ${channel}: ${String(err)}`,
      );
    }
  }

  /** Close the publisher connection cleanly on shutdown. */
  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
  }
}
