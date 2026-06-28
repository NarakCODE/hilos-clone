import { Module } from "@nestjs/common";
import {
  loadWorkerConfig,
  WORKER_CONFIG,
  type WorkerConfig,
} from "../config/worker-config";
import { RealtimePublisher } from "./realtime-publisher";

/**
 * Provides the {@link RealtimePublisher} (Redis pub/sub) used by the worker's
 * job processors to emit realtime events consumed by the API's socket.io Redis
 * adapter.
 *
 * `WORKER_CONFIG` is provided here too so this module is usable standalone
 * (e.g. in unit tests) without importing {@link QueuesModule}.
 */
@Module({
  providers: [
    {
      provide: WORKER_CONFIG,
      useFactory: (): WorkerConfig => loadWorkerConfig(),
    },
    RealtimePublisher,
  ],
  exports: [RealtimePublisher],
})
export class RealtimeModule {}
