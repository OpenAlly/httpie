// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";
import { randomBytes } from "node:crypto";
import {
  brotliCompressSync,
  deflateSync,
  gzipSync,
  zstdCompressSync
} from "node:zlib";

// Import Internal Dependencies
import {
  getResponseData,
  kMaxContentEncodings
} from "../../src/http/responseData.ts";
import { toArrayBuffer } from "../helpers/buffer.ts";

describe("getResponseData (mode: 'decompress')", () => {
  it("must returns the original buffer when there is no 'content-encoding'", async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: {}
    };

    const data = await getResponseData(mockResponse as any, "decompress");

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

    try {
      await getResponseData(mockResponse as any, "decompress");
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

    try {
      await getResponseData(mockResponse as any, "decompress");
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

  it("must throw when there are more encodings than the maximum allowed", async(t) => {
    t.plan(4);

    const buf = Buffer.from("hello world!");
    const encodings = Array.from(
      { length: kMaxContentEncodings + 1 },
      () => "gzip"
    );
    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-encoding": encodings.join(", ") }
    };

    try {
      await getResponseData(mockResponse as any, "decompress");
    }
    catch (error: any) {
      t.assert.equal(error.name, "TooManyContentEncodings");
      t.assert.equal(
        error.message,
        `Too many content-encodings in the response (received: ${encodings.length}).`
      );
      t.assert.deepEqual(error.encodings, encodings);
      t.assert.deepEqual(error.buffer, buf);
    }
  });

  it("must throw when the payload cannot be decompressed with the given encoding", async(t) => {
    t.plan(2);

    const buf = Buffer.from("hello world!");
    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-encoding": "gzip" }
    };

    try {
      await getResponseData(mockResponse as any, "decompress");
    }
    catch (error: any) {
      t.assert.equal(error.name, "UnexpectedDecompressionError");
      t.assert.deepEqual(error.buffer, buf);
    }
  });

  it("must not mutate the 'content-encoding' header", async() => {
    const buf = Buffer.from("hello world!");
    const encodings = ["deflate", "gzip"];
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(deflateSync(buf))) },
      headers: { "content-encoding": encodings }
    };

    await getResponseData(mockResponse as any, "decompress");

    assert.deepEqual(encodings, ["deflate", "gzip"]);
  });

  it("must be callable twice on the same headers and yield the same result", async() => {
    const buf = Buffer.from("hello world!");
    const compressed = gzipSync(deflateSync(buf));
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(compressed) },
      headers: { "content-encoding": ["deflate", "gzip"] }
    };

    assert.deepEqual(await getResponseData(mockResponse as any, "decompress"), buf);
    assert.deepEqual(await getResponseData(mockResponse as any, "decompress"), buf);
  });

  [
    ["gzip", gzipSync],
    ["x-gzip", gzipSync],
    ["GZIP", gzipSync],
    ["br", brotliCompressSync],
    ["deflate", deflateSync],
    ["compress", deflateSync],
    ["x-compress", deflateSync],
    ["zstd", zstdCompressSync]
  ].forEach(([encoding, compress]: any) => {
    it(`must return an uncompressed buffer when the 'content-encoding' header is set with '${encoding}'`, async() => {
      const buf = Buffer.from("hello world!");
      const mockResponse = {
        body: { arrayBuffer: () => toArrayBuffer(compress(buf)) },
        headers: { "content-encoding": encoding }
      };
      const data = await getResponseData(mockResponse as any, "decompress");

      assert.deepEqual(data, buf);
    });
  });

  it("must decompress in reverse order of the given encodings list when there are multiple compression types", async() => {
    const buf = Buffer.from("hello world!");
    const encodings = ["deflate", "gzip"];
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(deflateSync(buf))) },
      headers: { "content-encoding": encodings }
    };
    const data = await getResponseData(mockResponse as any, "decompress");

    assert.deepEqual(data, buf);
  });

  it("must decompress in reverse order of the given encodings string when there are multiple compression types", async() => {
    const buf = Buffer.from("hello world!");
    const encodings = "deflate, gzip";
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(gzipSync(deflateSync(buf))) },
      headers: { "content-encoding": encodings }
    };
    const data = await getResponseData(mockResponse as any, "decompress");

    assert.deepEqual(data, buf);
  });
});
