// Import Node.js Dependencies
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { brotliCompress, deflate, gzip } from "node:zlib";
import { promisify } from "node:util";

// Import Third-party Dependencies
import { type Interceptable } from "undici";

// Import Internal Dependencies
import { type HttpMethod, isHttpieError, request } from "../../src/index.ts";
import { createMockPool, kMockUrl as kUrl } from "../helpers/mockPool.ts";

// VARS
let pool: Interceptable;

before(() => {
  pool = createMockPool();
});

// CONSTANTS
const kAsyncGzip = promisify(gzip);
const kAsyncBrotli = promisify(brotliCompress);
const kAsyncDeflate = promisify(deflate);

describe("PARSE mode (default)", () => {
  const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

  for (const method of methods) {
    describe(method, () => {
      it("should return a parsed response as text when 'content-type' header starts with 'text/'", async() => {
        const target = { method, path: "/test" };
        const payload = "La data.";
        const buf = Buffer.from(payload);
        const headers = { "content-type": "text/klsmdkf" };
        const statusCode = 200;

        pool.intercept(target).reply(statusCode, buf, { headers });

        const response = await request(target.method, kUrl + target.path);

        assert.strictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
        assert.strictEqual(response.statusCode, statusCode);
      });

      it("should return a parsed response as object when 'content-type' is 'application/json'", async() => {
        const target = { method, path: "/test" };
        const payload = { my: "object" };
        const buf = Buffer.from(JSON.stringify(payload));
        const headers = { "content-type": "application/json" };
        const statusCode = 200;

        pool.intercept(target).reply(statusCode, buf, { headers });

        const response = await request(target.method, kUrl + target.path);

        assert.deepStrictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
        assert.strictEqual(response.statusCode, statusCode);
      });

      it("should return a buffer when 'content-type' is 'application/pdf'", async() => {
        const target = { method, path: "/test" };
        const payload = Buffer.from("mon pdf");
        const headers = { "content-type": "application/pdf" };
        const statusCode = 200;

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path);

        assert.deepStrictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
        assert.strictEqual(response.statusCode, statusCode);
      });

      it("should return a buffer when 'content-type' is unsupported", async() => {
        const target = { method, path: "/test" };
        const payload = Buffer.from(JSON.stringify({ my: "object" }));
        const headers = { "content-type": "application/msword" };
        const statusCode = 200;

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path);

        assert.deepStrictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
      });

      it("should throw when 'content-type' is unknown", async() => {
        const target = { method, path: "/test" };
        const payload = Buffer.from(JSON.stringify({ my: "object" }));
        const headers = { "content-type": "unknown" };
        const statusCode = 200;

        pool.intercept(target).reply(statusCode, payload, { headers });

        try {
          await request(target.method, kUrl + target.path);
          assert.fail("Expected error not thrown");
        }
        catch (error: any) {
          assert.ok(isHttpieError(error));
          assert.strictEqual(
            error.message,
            "An unexpected error occurred when trying to parse the response body (reason: 'invalid media type')."
          );
          assert.deepStrictEqual(error.headers, headers);
          assert.strictEqual(error.statusCode, 200);
        }
      });

      it("should throw when 'content-encoding' is unsupported", async() => {
        const target = { method, path: "/test" };
        const payload = await kAsyncGzip("Mon document");
        const headers = { "content-encoding": "unknown" };
        const statusCode = 200;

        pool.intercept(target).reply(statusCode, payload, { headers });

        try {
          await request(target.method, kUrl + target.path);
          assert.fail("Expected error not thrown");
        }
        catch (error: any) {
          assert.strictEqual(error.message, "Unsupported encoding 'unknown'.");
          assert.deepStrictEqual(error.buffer, payload);
          assert.deepStrictEqual(error.headers, headers);
          assert.strictEqual(error.statusCode, statusCode);
          assert.ok(isHttpieError(error));
        }
      });

      const encodings = [
        { encoding: "gzip", compress: kAsyncGzip },
        { encoding: "x-gzip", compress: kAsyncGzip },
        { encoding: "br", compress: kAsyncBrotli },
        { encoding: "deflate", compress: kAsyncDeflate }
      ];

      for (const { encoding, compress } of encodings) {
        it(`should decompress data when 'content-encoding' is '${encoding}'`, async() => {
          const target = { method, path: "/test" };
          const payload = "Payload";
          const compressedPayload = await compress(Buffer.from(payload));
          const headers = {
            "content-type": "text/html",
            "content-encoding": encoding
          };
          const statusCode = 200;

          pool.intercept(target).reply(statusCode, compressedPayload, { headers });

          const response = await request(target.method, kUrl + target.path);

          assert.strictEqual(response.data, payload);
          assert.deepStrictEqual(response.headers, headers);
          assert.strictEqual(response.statusCode, statusCode);
        });
      }
    });
  }
});
