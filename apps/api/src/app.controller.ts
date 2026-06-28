import { Controller, Get } from "@nestjs/common";

/**
 * Minimal liveness controller so the scaffolded app is bootable and verifiable
 * before the domain modules (auth, workspaces, rooms, ...) are added.
 */
@Controller()
export class AppController {
  @Get("health")
  health(): { status: "ok"; service: string; timestamp: string } {
    return {
      status: "ok",
      service: "@acw/api",
      timestamp: new Date().toISOString(),
    };
  }
}
