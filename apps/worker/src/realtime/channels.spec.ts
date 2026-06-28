import * as fc from "fast-check";
import {
  REALTIME_EVENTS,
  roomChannel,
  workspaceChannel,
} from "./channels";

describe("realtime channels", () => {
  it("namespaces room channels by room id", () => {
    expect(roomChannel("room-1")).toBe("realtime:room:room-1");
  });

  it("namespaces workspace channels by workspace id", () => {
    expect(workspaceChannel("ws-1")).toBe("realtime:workspace:ws-1");
  });

  it("never collides room and workspace channels for the same id (property)", () => {
    fc.assert(
      fc.property(fc.string(), (id) => {
        expect(roomChannel(id)).not.toBe(workspaceChannel(id));
      }),
    );
  });

  it("exposes the worker-emitted agent-run lifecycle events", () => {
    expect(REALTIME_EVENTS.AGENT_RUN_STARTED).toBe("agent:run:started");
    expect(REALTIME_EVENTS.AGENT_RUN_STEP).toBe("agent:run:step");
    expect(REALTIME_EVENTS.AGENT_RUN_COMPLETED).toBe("agent:run:completed");
    expect(REALTIME_EVENTS.AGENT_RUN_FAILED).toBe("agent:run:failed");
    expect(REALTIME_EVENTS.GITHUB_EVENT_CREATED).toBe("github:event:created");
  });
});
