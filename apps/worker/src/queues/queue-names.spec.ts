import { QUEUE_NAMES } from "./queue-names";

describe("QUEUE_NAMES", () => {
  it("defines the agent-run and webhook queue names", () => {
    expect(QUEUE_NAMES.AGENT_RUN).toBe("agent-run");
    expect(QUEUE_NAMES.WEBHOOK).toBe("webhook");
  });

  it("uses unique queue names", () => {
    const names = Object.values(QUEUE_NAMES);
    expect(new Set(names).size).toBe(names.length);
  });
});
