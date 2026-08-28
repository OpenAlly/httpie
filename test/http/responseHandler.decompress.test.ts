// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";

// Import Internal Dependencies
import { HttpieResponseHandler } from "../../src/http/responseHandler.js";
import { toArrayBuffer } from "../helpers/buffer.js";

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
