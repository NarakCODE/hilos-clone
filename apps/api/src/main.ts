import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

/**
 * Bootstrap the NestJS API.
 *
 * - Registers the {@link GlobalExceptionFilter} globally (also wired via
 *   `APP_FILTER` in {@link AppModule}; registering here keeps it active for
 *   bootstrap-time errors too).
 * - Enables CORS for the web frontend (`WEB_APP_URL`) with credentials so the
 *   httpOnly session cookie flows (Req 1.8).
 * - Listens on `API_PORT` (default 4000, per `.env.example`).
 *
 * Per-route request validation uses the Zod-backed `ZodValidationPipe` wired
 * to `@acw/shared` schemas; Nest's built-in `ValidationPipe` is left disabled
 * by default since DTOs are validated with Zod, not class-validator.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: process.env.WEB_APP_URL ?? "http://localhost:3000",
    credentials: true,
  });

  // Intentionally NOT a global validation pipe over DTOs (Zod handles that
  // per-route). Kept here for any class-based transforms added later.
  void ValidationPipe;

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);

  Logger.log(`@acw/api listening on http://localhost:${port}`, "Bootstrap");
}

void bootstrap();
