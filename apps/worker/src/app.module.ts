import { Module } from "@nestjs/common";
import { QueuesModule } from "./queues/queues.module";
import { RealtimeModule } from "./realtime/realtime.module";

/**
 * Root worker module.
 *
 * Wires the queue infrastructure ({@link QueuesModule}: BullMQ agent-run +
 * webhook queues) and the realtime fan-out ({@link RealtimeModule}: Redis
 * pub/sub publisher). The actual job processors — Agent_Runner (task 13.x) and
 * Webhook_Processor (task 17.x) — register their `Worker` consumers in feature
 * modules imported here as they are implemented.
 */
@Module({
  imports: [QueuesModule, RealtimeModule],
})
export class AppModule {}
