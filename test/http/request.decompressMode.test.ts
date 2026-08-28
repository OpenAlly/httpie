// Import Node.js Dependencies
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { brotliCompress, deflate, gzip } from "node:zlib";
import { promisify } from "node:util";

// Import Third-party Dependencies
import { type Interceptable } from "undici";

// Import Internal Dependencies
import { type HttpMethod, isHttpieError, request } from "../../src/index.js";
import { createMockPool, kMockUrl as kUrl } from "../helpers/mockPool.js";

// VARS
let pool: Interceptable;

before(() => {
  pool = createMockPool();
});

// CONSTANTS
const kAsyncGzip = promisify(gzip);
const kAsyncBrotli = promisify(brotliCompress);
const kAsyncDeflate = promisify(deflate);

describe("DECOMPRESS mode", () => {
  const methods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

  for (const method of methods) {
    describe(method, () => {
      it("should return a buffer without parsing it even if 'content-type' header exists", async() => {
        const target = { method, path: "/test" };
        const statusCode = 200;
        const headers = { "content-type": "text/klsmdkf" };
        const payload = Buffer.from("La data.");

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path, { mode: "decompress" });

        assert.deepStrictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
      });

      it("should throw when 'content-encoding' header is set with unsupported value", async() => {
        const target = { method, path: "/test" };
        const statusCode = 200;
        const headers = { "content-encoding": "unknown" };
        const payload = Buffer.from("Mon document");

        pool.intercept(target).reply(statusCode, payload, { headers });

        try {
          await request(target.method, kUrl + target.path, { mode: "decompress" });
          assert.fail("Expected an error to be thrown");
        }
        catch (error: any) {
          assert.strictEqual(error.message, "Unsupported encoding 'unknown'.");
          assert.deepStrictEqual(error.buffer, payload);
          assert.deepStrictEqual(error.headers, headers);
          assert.ok(isHttpieError(error));
          assert.strictEqual(error.statusCode, 200);
        }
      });

      it("should throw when 'content-encoding' header is invalid", async() => {
        const target = { method, path: "/test" };
        const statusCode = 200;
        const headers = { "content-encoding": "gzip" };
        const payload = await kAsyncBrotli("Mon document");

        pool.intercept(target).reply(statusCode, payload, { headers });

        try {
          await request(target.method, kUrl + target.path, { mode: "decompress" });
          assert.fail("Expected an error to be thrown");
        }
        catch (error: any) {
          assert.ok(error.reason);
          assert.strictEqual(
            error.message,
            "An unexpected error occurred when trying to decompress the response body (reason: 'incorrect header check')."
          );
          assert.deepStrictEqual(error.buffer, payload);
          assert.deepStrictEqual(error.headers, headers);
          assert.ok(error.reason);
          assert.strictEqual(error.reason.message, "incorrect header check");
          assert.ok(isHttpieError(error));
          assert.strictEqual(error.statusCode, 200);
        }
      });

      const encodings = [
        { encoding: "gzip", compress: kAsyncGzip },
        { encoding: "x-gzip", compress: kAsyncGzip },
        { encoding: "br", compress: kAsyncBrotli },
        { encoding: "deflate", compress: kAsyncDeflate }
      ];

      for (const { encoding, compress } of encodings) {
        it(`should decompress data when 'content-encoding' header is set with '${encoding}'`, async() => {
          const target = { method, path: "/test" };
          const payload = Buffer.from("Payload");
          const compressedPayload = await compress(payload);
          const statusCode = 200;
          const headers = { "content-type": "text/html", "content-encoding": encoding };

          pool.intercept(target).reply(statusCode, compressedPayload, { headers });

          const response = await request(target.method, kUrl + target.path, { mode: "decompress" });

          assert.deepStrictEqual(response.data, payload);
          assert.deepStrictEqual(response.headers, headers);
        });
      }
    });
  }
});
