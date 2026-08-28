// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { createAuthorizationHeader, createHeaders } from "../../src/utils/headers.ts";

describe("createHeaders", () => {
  it("should return a plain object with 'user-agent' equal to 'httpie'", () => {
    const result = createHeaders({});

    assert.deepStrictEqual(result, { "user-agent": "httpie" });
  });

  it("should re-use provided headers plain object", () => {
    const result = createHeaders({
      headers: { foo: "bar" }
    });

    assert.deepStrictEqual(result, { foo: "bar", "user-agent": "httpie" });
  });

  it("should overwrite the 'user-agent' header", () => {
    const result = createHeaders({
      headers: { "user-agent": "myUserAgent" }
    });

    assert.deepStrictEqual(result, { "user-agent": "myUserAgent" });
  });

  it("should overwrite the default 'user-agent' header regardless of casing (no duplicate)", () => {
    // A caller-provided header must replace the default one even when the casing
    // differs, otherwise both 'user-agent' and 'User-Agent' end up in the object
    // and HTTP/2 rejects the request with ERR_HTTP2_HEADER_SINGLE_VALUE.
    const result = createHeaders({
      headers: { "User-Agent": "myUserAgent" }
    });

    assert.deepStrictEqual(result, { "User-Agent": "myUserAgent" });
  });

  it("should add authorization header (and override original property)", () => {
    const result = createHeaders({
      headers: {
        Authorization: "bar"
      },
      authorization: "foo"
    });

    assert.deepStrictEqual(result, { Authorization: "Bearer foo", "user-agent": "httpie" });
  });
});

describe("createAuthorizationHeader", () => {
  it("it should start with 'Bearer ' if the token is Bearer or empty string", () => {
    assert.strictEqual(createAuthorizationHeader(""), "Bearer ");
    assert.strictEqual(createAuthorizationHeader("lol"), "Bearer lol");
  });

  it("it should start with 'Basic ' for a Basic Authentication", () => {
    const result = createAuthorizationHeader("toto:lolo");
    const base64 = result.split(" ")[1];

    assert.strictEqual(result.startsWith("Basic "), true);
    assert.strictEqual(Buffer.from(base64, "base64").toString("ascii"), "toto:lolo");
  });
});
