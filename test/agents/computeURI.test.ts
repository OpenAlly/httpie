// Import Node.js Dependencies
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { computeURI, computeURIOnAllAgents, URI_CACHE } from "../../src/agents/computeURI.js";
import { windev } from "../helpers/index.js";

// CONSTANTS
const kWindevMonitoringURL = "https://ws.dev.myunisoft.tech/ws_monitoring";

describe("computeURIOnAllAgents", () => {
  it("should compute with windev agent", () => {
    const result = computeURIOnAllAgents("/windev/ws_monitoring");
    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);
  });

  it("should return the given URI with no computation", () => {
    const result = computeURIOnAllAgents("https://www.google.fr/");
    assert.strictEqual(result.url.href, "https://www.google.fr/");
    assert.strictEqual(result.agent, null);
  });

  it("should throw an Error if no computation because that's not a valid URI", () => {
    assert.throws(() => computeURIOnAllAgents("/xdd/healthz"));
  });
});

describe("computeURI", () => {
  beforeEach(() => {
    URI_CACHE.clear();
  });

  it("should compute a windev URI (as string)", () => {
    const result = computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(URI_CACHE.has(kWindevMonitoringURL), true);
  });

  it("should compute a windev URI (as WHATWG URL)", () => {
    const localURL = new URL(kWindevMonitoringURL);
    const result = computeURI(localURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
    assert.strictEqual(result.agent, windev.agent);

    assert.strictEqual(URI_CACHE.has(localURL.toString()), true);
  });

  it("should return cached entry", () => {
    const cached = computeURI(kWindevMonitoringURL);
    const result = computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, cached.url.href);
    assert.strictEqual(result.agent, cached.agent);
  });

  it("should not leak a mutated querystring into the cached entry", () => {
    computeURI(kWindevMonitoringURL).url.searchParams.set("token", "secret");

    const result = computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
  });

  it("should not leak a mutation of the caller URL into the cached entry", () => {
    const localURL = new URL(kWindevMonitoringURL);
    computeURI(localURL);
    localURL.searchParams.set("token", "secret");

    const result = computeURI(kWindevMonitoringURL);

    assert.strictEqual(result.url.href, kWindevMonitoringURL);
  });

  it("should compute an URL not related to any local agents", () => {
    const stringURL = "https://www.linkedin.com/feed/";
    const result = computeURI(new URL("", stringURL));

    assert.strictEqual(result.url.href, stringURL);
    assert.strictEqual(result.agent, null);
    assert.strictEqual(result.limit, undefined);
  });
});
