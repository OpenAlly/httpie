// Import Node.js Dependencies
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { windev } from "./helpers";
import * as Agents from "../src/agents";

// CONSTANTS
const kWindevMonitoringURL = "https://ws.dev.myunisoft.tech/ws_monitoring";

describe("agents", () => {
  it("should be an Array of CustomHttpAgent and must remain extensible", () => {
    assert.ok(Agents.agents instanceof Set);
    assert.ok(Object.isExtensible(Agents.agents));
  });
});

describe("isAgentPathMatchingURI", () => {
  it("should compute the path because it start with '/windev'", () => {
    const result = Agents.isAgentPathMatchingURI("/windev/ws_monitoring", windev);
    assert.strictEqual(result?.href, kWindevMonitoringURL);

    // Same but without '/' at the beginning
    const result2 = Agents.isAgentPathMatchingURI("windev/ws_monitoring", windev);
    assert.strictEqual(result2?.href, kWindevMonitoringURL);
  });

  it("should not compute the path and return null instead", () => {
    const result = Agents.isAgentPathMatchingURI("/xd/ws_monitoring", windev);

    assert.strictEqual(result, null);
  });
});

describe("computeURIOnAllAgents", () => {
  it("should compute with windev agent", () => {
    const result = Agents.computeURIOnAllAgents("/windev/ws_monitoring");
    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);
  });

  it("should return the given URI with no computation", () => {
    const result = Agents.computeURIOnAllAgents("https://www.google.fr/");
    assert.strictEqual(result.url.href, "https://www.google.fr/");
    assert.strictEqual(result.agent, null);
  });

  it("should throw an Error if no computation because that's not a valid URI", () => {
    assert.throws(() => Agents.computeURIOnAllAgents("/xdd/healthz"));
  });
});

describe("detectAgentFromURI", () => {
  it("should detect windev agent with URI hostname", () => {
    const returnedAgent = Agents.detectAgentFromURI(new URL("https://ws.dev.myunisoft.tech"));

    assert.strictEqual(returnedAgent, windev);
  });

  it("should return null if hostname is not internaly known", () => {
    const returnedAgent = Agents.detectAgentFromURI(new URL("https://www.google.fr/"));

    assert.strictEqual(returnedAgent, null);
  });
});

describe("computeURI", () => {
  beforeEach(() => {
    Agents.URI_CACHE.clear();
  });

  it("should compute a windev URI (as string)", () => {
    const result = Agents.computeURI("GET", kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(Agents.URI_CACHE.has("GET" + kWindevMonitoringURL), true);
  });

  it("should compute a windev URI (as WHATWG URL)", () => {
    const localURL = new URL(kWindevMonitoringURL);
    const result = Agents.computeURI("POST", localURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(Agents.URI_CACHE.has("POST" + localURL.toString()), true);
  });

  it("should return cached entry", () => {
    Agents.URI_CACHE.set("GET" + kWindevMonitoringURL, true as any);
    const result = Agents.computeURI("GET", kWindevMonitoringURL) as unknown as boolean;

    assert.strictEqual(result, true);
  });

  it("should not return cached entry because method doesn't match", () => {
    Agents.URI_CACHE.set("POST" + kWindevMonitoringURL, true as any);
    const result = Agents.computeURI("GET", kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(Agents.URI_CACHE.has("GET" + kWindevMonitoringURL), true);
  });

  it("should compute an URL not related to any local agents", () => {
    const stringURL = "https://www.linkedin.com/feed/";
    const result = Agents.computeURI("GET", new URL("", stringURL));

    assert.strictEqual(result.url.href, stringURL);
    assert.strictEqual(result.agent, null);
    assert.strictEqual(result.limit, undefined);
  });
});
