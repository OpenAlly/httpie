// Import Node.js Dependencies
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { URLSearchParams } from "node:url";

// Import Internal Dependencies
import { prepareRequest } from "../src/dispatch";
import { URI_CACHE } from "../src/agents";

// CONSTANTS
const kDummyURL = "https://www.linkedin.com/feed/";

describe("prepareRequest", () => {
  beforeEach(() => {
    URI_CACHE.clear();
  });

  it("should append a querystring given as a string", () => {
    const { url } = prepareRequest("GET", kDummyURL, { querystring: "foo=bar" });

    assert.strictEqual(url.href, `${kDummyURL}?foo=bar`);
  });

  it("should append a querystring given as an URLSearchParams", () => {
    const { url } = prepareRequest("GET", kDummyURL, {
      querystring: new URLSearchParams({ foo: "bar" })
    });

    assert.strictEqual(url.href, `${kDummyURL}?foo=bar`);
  });

  it("should not leak a querystring into a later request on the same URI", () => {
    prepareRequest("GET", kDummyURL, { querystring: "token=secret" });

    const { url } = prepareRequest("GET", kDummyURL, {});

    assert.strictEqual(url.href, kDummyURL);
  });

  it("should default limit and dispatcher to null/undefined", () => {
    const { limit, options } = prepareRequest("GET", kDummyURL, {});

    assert.strictEqual(limit, null);
    assert.strictEqual(options.dispatcher, undefined);
    assert.strictEqual(options.method, "GET");
  });

  it("should forward the blocking option", () => {
    const { options } = prepareRequest("HEAD", kDummyURL, { blocking: false });

    assert.strictEqual(options.blocking, false);
  });

  it("should build headers and body from the given options", () => {
    const { options } = prepareRequest("POST", kDummyURL, {
      body: { foo: "bar" },
      authorization: "token"
    });

    assert.strictEqual(options.body, JSON.stringify({ foo: "bar" }));
    assert.strictEqual(options.headers.Authorization, "Bearer token");
    assert.strictEqual(options.headers["content-type"], "application/json");
  });
});
