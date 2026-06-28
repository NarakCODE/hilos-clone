import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

/**
 * Root application module.
 *
 * Registers the {@link GlobalExceptionFilter} application-wide via `APP_FILTER`
 * so every domain module added later (auth, workspaces, rooms, messaging,
 * agents, github, notifications, audit) automatically returns the shared
 * `{ error: { code, message, fields? } }` envelope. Domain feature modules are
 * imported here as they are implemented in subsequent tasks.
 */
@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
