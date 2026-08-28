// Import Node.js Dependencies
import { describe, it } from "node:test";
import { IncomingHttpHeaders } from "node:http2";
import assert from "node:assert";
import stream from "node:stream";

// Import Internal Dependencies
import { createBody, isAsyncIterable } from "../../src/utils/body.js";

describe("isAsyncIterable", () => {
  it("should return false for synchronous iterable like an Array", () => {
    assert.strictEqual(isAsyncIterable([]), false);
  });

  it("should return false for synchronous iterable like a primitive string", () => {
    assert.strictEqual(isAsyncIterable("foobar"), false);
  });

  it("should return false for null and undefined", () => {
    assert.strictEqual(isAsyncIterable(null), false);
    assert.strictEqual(isAsyncIterable(undefined), false);
  });

  it("should return true for a Async Generator Function", () => {
    async function* foo() {
      yield "bar";
    }
    assert.strictEqual(isAsyncIterable(foo()), true);
  });
});

describe("createBody", () => {
  it("should return 'undefined' when undefined is provided as body argument", () => {
    assert.strictEqual(createBody(undefined), undefined);
  });

  it("should serialize a null body instead of throwing", () => {
    const headerRef: IncomingHttpHeaders = {};

    const result = createBody(null, headerRef);

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

    const result = createBody(body, headerRef);

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

    const result = createBody(body, headerRef);

    assert.strictEqual(result, bodyStr);
    assert.strictEqual(Object.keys(headerRef).length, 2);
    assert.strictEqual(headerRef["content-type"], "application/x-www-form-urlencoded");
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(bodyStr)));
  });

  it("should not overwrite an explicitly provided content-type", () => {
    const body = { foo: "bar" };
    const headerRef: IncomingHttpHeaders = { "Content-Type": "application/vnd.api+json" };

    createBody(body, headerRef);

    assert.deepStrictEqual(Object.keys(headerRef), ["Content-Type", "content-length"]);
    assert.strictEqual(headerRef["Content-Type"], "application/vnd.api+json");
  });

  it("should not overwrite an explicitly provided content-type for an URLEncoded body", () => {
    const body = new URLSearchParams({ foo: "bar" });
    const headerRef: IncomingHttpHeaders = { "content-type": "application/x-my-form" };

    createBody(body, headerRef);

    assert.strictEqual(headerRef["content-type"], "application/x-my-form");
  });

  it("should replace a differently cased content-length instead of duplicating it", () => {
    const body = { foo: "bar" };
    const headerRef: IncomingHttpHeaders = { "Content-Length": "999" };

    createBody(body, headerRef);

    assert.deepStrictEqual(Object.keys(headerRef), ["content-type", "content-length"]);
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(JSON.stringify(body))));
  });

  it("should be able to prepare a Buffer body", () => {
    const body = Buffer.from("hello world!");
    const headerRef: IncomingHttpHeaders = {};

    const result = createBody(body, headerRef);

    assert.strictEqual(result, body);
    assert.strictEqual(Object.keys(headerRef).length, 1);
    assert.strictEqual(headerRef["content-length"], String(Buffer.byteLength(body)));
  });

  it("should return the ReadableStream without any transformation", () => {
    const headerRef: IncomingHttpHeaders = {};
    const readStream = new stream.Readable();

    const result = createBody(readStream, headerRef);

    assert.strictEqual(result, readStream);
    assert.strictEqual(Object.keys(headerRef).length, 0);
  });
});
