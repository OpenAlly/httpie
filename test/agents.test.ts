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
    const result = Agents.computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(Agents.URI_CACHE.has(kWindevMonitoringURL), true);
  });

  it("should compute a windev URI (as WHATWG URL)", () => {
    const localURL = new URL(kWindevMonitoringURL);
    const result = Agents.computeURI(localURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(Agents.URI_CACHE.has(localURL.toString()), true);
  });

  it("should return cached entry", () => {
    const cached = Agents.computeURI(kWindevMonitoringURL);
    const result = Agents.computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, cached.url.href);
    assert.strictEqual(result.agent, cached.agent);
  });

  it("should not leak a mutated querystring into the cached entry", () => {
    Agents.computeURI(kWindevMonitoringURL).url.searchParams.set("token", "secret");

    const result = Agents.computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
  });

  it("should not leak a mutation of the caller URL into the cached entry", () => {
    const localURL = new URL(kWindevMonitoringURL);
    Agents.computeURI(localURL);
    localURL.searchParams.set("token", "secret");

    const result = Agents.computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
  });

  it("should compute an URL not related to any local agents", () => {
    const stringURL = "https://www.linkedin.com/feed/";
    const result = Agents.computeURI(new URL("", stringURL));

    assert.strictEqual(result.url.href, stringURL);
    assert.strictEqual(result.agent, null);
    assert.strictEqual(result.limit, undefined);
  });
});
