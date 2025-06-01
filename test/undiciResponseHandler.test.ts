
// Import Node.js Dependencies
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";

// Import Internal Dependencies
import { HttpieResponseHandler } from "../src/class/undiciResponseHandler";

function toArrayBuffer(buffer: Buffer) {
  const { byteOffset, byteLength } = buffer;

  return buffer.buffer.slice(byteOffset, byteOffset + byteLength);
}

describe("HttpieResponseHandler.getData", () => {
  it("should return the parsed payload by default", async() => {
    const payload = { foo: "bar" };
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(JSON.stringify(payload))) },
      headers: { "content-type": "application/json" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData();

    assert.deepEqual(data, payload);
  });
});

describe("HttpieResponseHandler.getData (mode: 'raw')", () => {
  it("should return the rawBuffer", async() => {
    const payload = Buffer.from(JSON.stringify({ foo: "bar" }));
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(payload) },
      headers: { "content-type": "application/json" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("raw");

    assert.deepEqual(data, payload);
  });

  it("should throw HttpieFetchBodyError", async(t) => {
    t.plan(4);

    const errMsg = "unexpected error";
    const mockResponse = {
      statusCode: 200,
      body: {
        arrayBuffer: () => {
          throw new Error(errMsg);
        }
      },
      headers: { "content-type": "application/json" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    try {
      await handler.getData();
    }
    catch (error: any) {
      t.assert.equal(error.name, "ResponseFetchError");
      t.assert.equal(
        error.message,
        `An unexpected error occurred while trying to retrieve the response body (reason: '${errMsg}').`
      );
      t.assert.equal(error.statusCode, mockResponse.statusCode);
      t.assert.deepEqual(error.headers, mockResponse.headers);
    }
  });
});

describe("HttpieResponseHandler.getData (mode: 'decompress')", () => {
  it("must returns the original buffer when there is no 'content-encoding'", async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: {}
    };

    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });

  it("must throw when the 'content-encoding' header is set with an unknown value", async(t) => {
    t.plan(6);

    const buf = Buffer.from("hello world!");
    const encoding = randomBytes(4).toString("hex");
    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-encoding": encoding }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);

    try {
      await handler.getData("decompress");
    }
    catch (error: any) {
      t.assert.equal(error.message, `Unsupported encoding '${encoding}'.`);
      t.assert.deepEqual(error.buffer, buf);
      t.assert.deepEqual(error.encodings, [encoding]);
      t.assert.equal(error.name, "DecompressionNotSupported");
      t.assert.equal(error.statusCode, mockResponse.statusCode);
      t.assert.deepEqual(error.headers, mockResponse.headers);
    }
  });

  it("must throw when the 'content-encoding' header is a list that includes an unknown value", async(t) => {
    t.plan(6);

    const buf = Buffer.from("hello world!");
    const encoding = randomBytes(4).toString("hex");
    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-encoding": [encoding] }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);

    try {
      await handler.getData("decompress");
    }
    catch (error: any) {
      t.assert.equal(error.message, `Unsupported encoding '${encoding}'.`);
      t.assert.deepEqual(error.buffer, buf);
      t.assert.deepEqual(error.encodings, [encoding]);
      t.assert.equal(error.name, "DecompressionNotSupported");
      t.assert.equal(error.statusCode, mockResponse.statusCode);
      t.assert.deepEqual(error.headers, mockResponse.headers);
    }
  });

  it(`must use 'gunzip' before to returning an uncompressed buffer
    when the 'content-encoding' header is set with 'gzip'`, async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(buf)) },
      headers: { "content-encoding": "gzip" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });

  it(`must use 'gunzip' before to returning an uncompressed buffer
    when the 'content-encoding' header is set with 'x-gzip'`, async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(buf)) },
      headers: { "content-encoding": "x-gzip" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });

  it(`must use 'brotliDecompress' before to returning an uncompressed buffer
    when the 'content-encoding' header is set with 'br'`, async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(brotliCompressSync(buf)) },
      headers: { "content-encoding": "br" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });

  it(`must use 'inflate' before to returning an uncompressed buffer
    when the 'content-encoding' header is set with 'deflate'`, async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(deflateSync(buf)) },
      headers: { "content-encoding": "deflate" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });

  it("must decompress in reverse order of the given encodings list when there are multiple compression types", async() => {
    const buf = Buffer.from("hello world!");
    const encodings = ["deflate", "gzip"];
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(deflateSync(buf))) },
      headers: { "content-encoding": encodings }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });

  it("must decompress in reverse order of the given encodings string when there are multiple compression types", async() => {
    const buf = Buffer.from("hello world!");
    const encodings = "deflate, gzip";
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(deflateSync(buf))) },
      headers: { "content-encoding": encodings }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("decompress");

    assert.deepEqual(data, buf);
  });
});

describe("HttpieResponseHandler.getData (mode: 'parse')", () => {
  it("should parse a JSON response with no errors", async() => {
    const payload = { foo: "bar" };
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(JSON.stringify(payload))) },
      headers: { "content-type": "application/json" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("parse");

    assert.deepEqual(data, payload);
  });

  it("should parse an invalid JSON response but still keep the request data in the Error", async(t) => {
    t.plan(5);

    const payload = "{\"foo\": bar}";
    const buf = Buffer.from("{\"foo\": bar}");

    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(payload)) },
      headers: { "content-type": "application/json" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    try {
      await handler.getData("parse");
    }
    catch (error: any) {
      t.assert.equal(error.text, payload);
      t.assert.deepEqual(error.buffer, buf);
      t.assert.equal(error.name, "ResponseParsingError");
      t.assert.equal(error.statusCode, mockResponse.statusCode);
      t.assert.deepEqual(error.headers, mockResponse.headers);
    }
  });

  it("should return the original buffer when there is no content-type", async() => {
    const payload = Buffer.from("hello world!");
    // const data = await HttpieResponseHandler.parseUndiciResponse<Buffer>(payload);

    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(payload) },
      headers: {}
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("parse");

    assert.deepEqual(data, payload);
  });

  it("must converting it to a string when the 'content-type' header starts with 'text/'", async() => {
    const payload = "hello world!";
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(payload)) },
      headers: { "content-type": "text/anything" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("parse");

    assert.deepEqual(data, payload);
  });

  it("must converting body to JSON when the 'content-type' header is set with 'application/json'", async() => {
    const payload = { foo: "hello world!" };

    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(JSON.stringify(payload))) },
      headers: { "content-type": "application/json; charset=utf-8" }
    };
    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("parse");

    assert.deepEqual(data, payload);
  });

  it("must return the original buffer when 'content-type' header is set with 'application/pdf'", async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-type": "application/pdf" }
    };

    const handler = new HttpieResponseHandler(mockResponse as any);
    const data = await handler.getData("parse");

    assert.deepEqual(data, buf);
  });
});
