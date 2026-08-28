// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { agents, detectAgentFromURI, isAgentPathMatchingURI } from "../../src/agents/registry.js";
import { windev } from "../helpers/index.js";

// CONSTANTS
const kWindevMonitoringURL = "https://ws.dev.myunisoft.tech/ws_monitoring";

describe("agents", () => {
  it("should be an Array of CustomHttpAgent and must remain extensible", () => {
    assert.ok(agents instanceof Set);
    assert.ok(Object.isExtensible(agents));
  });
});

describe("isAgentPathMatchingURI", () => {
  it("should compute the path because it start with '/windev'", () => {
    const result = isAgentPathMatchingURI("/windev/ws_monitoring", windev);
    assert.strictEqual(result?.href, kWindevMonitoringURL);

    // Same but without '/' at the beginning
    const result2 = isAgentPathMatchingURI("windev/ws_monitoring", windev);
    assert.strictEqual(result2?.href, kWindevMonitoringURL);
  });

  it("should not compute the path and return null instead", () => {
    const result = isAgentPathMatchingURI("/xd/ws_monitoring", windev);

    assert.strictEqual(result, null);
  });
});

describe("detectAgentFromURI", () => {
  it("should detect windev agent with URI hostname", () => {
    const returnedAgent = detectAgentFromURI(new URL("https://ws.dev.myunisoft.tech"));

    assert.strictEqual(returnedAgent, windev);
  });

  it("should return null if hostname is not internaly known", () => {
    const returnedAgent = detectAgentFromURI(new URL("https://www.google.fr/"));

    assert.strictEqual(returnedAgent, null);
  });
});
