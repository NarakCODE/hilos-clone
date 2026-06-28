import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/**
 * Bootstrap the worker.
 *
 * The worker is a headless NestJS application context (no HTTP server): it
 * owns the BullMQ queue connections and the Redis pub/sub publisher. Job
 * processors (Agent_Runner, Webhook_Processor) are added in later tasks.
 *
 * `enableShutdownHooks` ensures `onModuleDestroy` runs on SIGINT/SIGTERM so the
 * queue and publisher Redis connections close cleanly.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
  });

  app.enableShutdownHooks();

  Logger.log(
    "@acw/worker started (queues + realtime publisher ready)",
    "Bootstrap",
  );
}

void bootstrap();
