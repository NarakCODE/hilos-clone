// @acw/worker
//
// BullMQ workers (agent runner + GitHub webhook processor) for the AI
// Collaboration Workspace.
//
// The runtime entry point is `main.ts` (`dist/main.js`). This barrel re-exports
// the queue infrastructure (queue names, job payload types), the worker config,
// and the realtime pub/sub publisher (channels + events) so the API producer
// side and the processors added in later tasks share a single source of truth.
export const PACKAGE_NAME = "@acw/worker";

export * from "./config/worker-config";
export * from "./queues/queue-names";
export * from "./queues/job-types";
export { QueuesModule } from "./queues/queues.module";
export * from "./realtime/channels";
export { RealtimePublisher } from "./realtime/realtime-publisher";
export { RealtimeModule } from "./realtime/realtime.module";
export { AppModule } from "./app.module";
