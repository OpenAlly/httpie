// Import Node.js Dependencies
import { describe, it } from "node:test";
import { IncomingHttpHeaders } from "node:http2";
import assert from "node:assert";
import stream from "node:stream";
import vm from "node:vm";

// Import Internal Dependencies
import * as Utils from "../src/utils";
import { HttpieOnHttpError } from "../src/class/HttpieOnHttpError";
import { HttpieDecompressionError, HttpieFetchBodyError, HttpieParserError } from "../src/class/HttpieHandlerError";

describe("isAsyncIterable", () => {
  it("should return false for synchronous iterable like an Array", () => {
    assert.strictEqual(Utils.isAsyncIterable([]), false);
  });

  it("should return false for synchronous iterable like a primitive string", () => {
    assert.strictEqual(Utils.isAsyncIterable("foobar"), false);
  });

  it("should return false for null and undefined", () => {
    assert.strictEqual(Utils.isAsyncIterable(null), false);
    assert.strictEqual(Utils.isAsyncIterable(undefined), false);
  });

  it("should return true for a Async Generator Function", () => {
    async function* foo() {
      yield "bar";
    }
    assert.strictEqual(Utils.isAsyncIterable(foo()), true);
  });
});

describe("getEncodingCharset", () => {
  it("should return 'utf-8' if no value is provided", () => {
    assert.strictEqual(Utils.getEncodingCharset(), "utf-8");
  });

  it("should return 'utf-8' if the provided charset is not known", () => {
    assert.strictEqual(Utils.getEncodingCharset("bolekeole"), "utf-8");
  });

  it("should return 'latin1' if the charset is equal to 'ISO-8859-1'", () => {
    assert.strictEqual(Utils.getEncodingCharset("ISO-8859-1"), "latin1");
  });

  it("should return the charset unchanged (only if the charset is a valid BufferEncoding)", () => {
    assert.strictEqual(Utils.getEncodingCharset("ascii"), "ascii");
  });
});

describe("createHeaders", () => {
  it("should return a plain object with 'user-agent' equal to 'httpie'", () => {
    const result = Utils.createHeaders({});

    assert.deepStrictEqual(result, { "user-agent": "httpie" });
  });

  it("should re-use provided headers plain object", () => {
    const result = Utils.createHeaders({
      headers: { foo: "bar" }
    });

    assert.deepStrictEqual(result, { foo: "bar", "user-agent": "httpie" });
  });

  it("should overwrite the 'user-agent' header", () => {
    const result = Utils.createHeaders({
      headers: { "user-agent": "myUserAgent" }
    });

    assert.deepStrictEqual(result, { "user-agent": "myUserAgent" });
  });

  it("should overwrite the default 'user-agent' header regardless of casing (no duplicate)", () => {
    // A caller-provided header must replace the default one even when the casing
    // differs, otherwise both 'user-agent' and 'User-Agent' end up in the object
    // and HTTP/2 rejects the request with ERR_HTTP2_HEADER_SINGLE_VALUE.
    const result = Utils.createHeaders({
      headers: { "User-Agent": "myUserAgent" }
    });

    assert.deepStrictEqual(result, { "User-Agent": "myUserAgent" });
  });

  it("should add authorization header (and override original property)", () => {
    const result = Utils.createHeaders({
      headers: {
        Authorization: "bar"
      },
      authorization: "foo"
    });

    assert.deepStrictEqual(result, { Authorization: "Bearer foo", "user-agent": "httpie" });
  });
});

describe("createBody", () => {
  it("should return 'undefined' when undefined is provided as body argument", () => {
    assert.strictEqual(Utils.createBody(undefined), undefined);
  });

  it("should serialize a null body instead of throwing", () => {
    const headerRef: IncomingHttpHeaders = {};

    const result = Utils.createBody(null, headerRef);

    assert.strictEqual(result, "null");
    assert.strictEqual(headerRef["content-type"], "application/json");
    assert.strictEqual(headerRef["content-length"], "4");
  });

  it("should be able to prepare and stringify a JSON body", () => {
    const body = {
      foo: "bar"
    };
    const bodyStr = JSON.stringify(body);
    const headerRef: IncomingHttpHeaders = {};

    const result = Utils.createBody(body, headerRef);

    assert.strictEqual(result, bodyStr);
    assert.strictEqual(Object.keys(headerRef).length, 2);
    assert.strictEqual(headerRef["content-type"], "application/json");
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(bodyStr)));
  });

  it("should be able to prepare a FORM (URLEncoded) body", () => {
    const body = new URLSearchParams({
      foo: "bar"
    });
    const bodyStr = body.toString();
    const headerRef: IncomingHttpHeaders = {};

    const result = Utils.createBody(body, headerRef);

    assert.strictEqual(result, bodyStr);
    assert.strictEqual(Object.keys(headerRef).length, 2);
    assert.strictEqual(headerRef["content-type"], "application/x-www-form-urlencoded");
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(bodyStr)));
  });

  it("should not overwrite an explicitly provided content-type", () => {
    const body = { foo: "bar" };
    const headerRef: IncomingHttpHeaders = { "Content-Type": "application/vnd.api+json" };

    Utils.createBody(body, headerRef);

    assert.deepStrictEqual(Object.keys(headerRef), ["Content-Type", "content-length"]);
    assert.strictEqual(headerRef["Content-Type"], "application/vnd.api+json");
  });

  it("should not overwrite an explicitly provided content-type for an URLEncoded body", () => {
    const body = new URLSearchParams({ foo: "bar" });
    const headerRef: IncomingHttpHeaders = { "content-type": "application/x-my-form" };

    Utils.createBody(body, headerRef);

    assert.strictEqual(headerRef["content-type"], "application/x-my-form");
  });

  it("should replace a differently cased content-length instead of duplicating it", () => {
    const body = { foo: "bar" };
    const headerRef: IncomingHttpHeaders = { "Content-Length": "999" };

    Utils.createBody(body, headerRef);

    assert.deepStrictEqual(Object.keys(headerRef), ["content-type", "content-length"]);
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(JSON.stringify(body))));
  });

  it("should be able to prepare a Buffer body", () => {
    const body = Buffer.from("hello world!");
    const headerRef: IncomingHttpHeaders = {};

    const result = Utils.createBody(body, headerRef);

    assert.strictEqual(result, body);
    assert.strictEqual(Object.keys(headerRef).length, 1);
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(body)));
  });

  it("should return the ReadableStream without any transformation", () => {
    const headerRef: IncomingHttpHeaders = {};
    const readStream = new stream.Readable();

    const result = Utils.createBody(readStream, headerRef);

    assert.strictEqual(result, readStream);
    assert.strictEqual(Object.keys(headerRef).length, 0);
  });
});

describe("createAuthorizationHeader", () => {
  it("it should start with 'Bearer ' if the token is Bearer or empty string", () => {
    assert.strictEqual(Utils.createAuthorizationHeader(""), "Bearer ");
    assert.strictEqual(Utils.createAuthorizationHeader("lol"), "Bearer lol");
  });

  it("it should start with 'Basic ' for a Basic Authentication", () => {
    const result = Utils.createAuthorizationHeader("toto:lolo");
    const base64 = result.split(" ")[1];

    assert.strictEqual(result.startsWith("Basic "), true);
    assert.strictEqual(Buffer.from(base64, "base64").toString("ascii"), "toto:lolo");
  });
});

describe("isHttpieError", () => {
  it("it should be true", () => {
    assert.strictEqual(
      Utils.isHttpieError(new HttpieOnHttpError({} as any)),
      true
    );
    assert.strictEqual(
      Utils.isHttpieError(new HttpieFetchBodyError({ message: "ResponseFetchError", response: {} } as any)),
      true
    );
    assert.strictEqual(
      Utils.isHttpieError(new HttpieDecompressionError({ message: "UnexpectedDecompressionError", response: {} } as any)),
      true
    );
    assert.strictEqual(
      Utils.isHttpieError(new HttpieParserError({ message: "ResponseParsingError", response: {} } as any)),
      true
    );
  });

  it("it should be false", () => {
    assert.strictEqual(Utils.isHttpieError(new Error()), false);
  });
});

describe("isHTTPError", () => {
  it("it should be true", () => {
    assert.strictEqual(Utils.isHTTPError(new HttpieOnHttpError({} as any)), true);
  });

  it("it should be false", () => {
    assert.strictEqual(Utils.isHTTPError(new Error()), false);
    assert.strictEqual(
      Utils.isHTTPError(new HttpieFetchBodyError({ message: "ResponseFetchError", response: {} } as any)),
      false
    );
    assert.strictEqual(
      Utils.isHTTPError(new HttpieDecompressionError({ message: "UnexpectedDecompressionError", response: {} } as any)),
      false
    );
    assert.strictEqual(
      Utils.isHTTPError(new HttpieParserError({ message: "ResponseParsingError", response: {} } as any)),
      false
    );
  });
});

describe("cross-realm error branding", () => {
  const foreignError = vm.runInNewContext(`
    class ForeignHttpieError extends Error {
      get [Symbol.for("@openally/httpie.error")]() {
        return "HttpieOnHttpError";
      }
    }

    new ForeignHttpieError("cross-realm");
  `);

  it("it should not be recognized by instanceof", () => {
    assert.strictEqual(foreignError instanceof HttpieOnHttpError, false);
  });

  it("it should still be recognized by the type guards", () => {
    assert.strictEqual(Utils.isHttpieError(foreignError), true);
    assert.strictEqual(Utils.isHTTPError(foreignError), true);
  });
});
