// @acw/api
//
// NestJS REST API + WebSocket gateway for the AI Collaboration Workspace.
//
// The runtime entry point is `main.ts` (`dist/main.js`). This barrel re-exports
// the cross-cutting infrastructure (domain errors, the global exception filter,
// the Zod validation pipe, and the cursor-pagination helper) plus the root
// module so they can be imported by tests and, where useful, sibling apps.
export const PACKAGE_NAME = "@acw/api";

export * from "./common";
export { AppModule } from "./app.module";
export { AppController } from "./app.controller";
