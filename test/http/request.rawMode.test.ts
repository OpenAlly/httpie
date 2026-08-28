// Import Node.js Dependencies
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { gzip } from "node:zlib";
import { promisify } from "node:util";

// Import Third-party Dependencies
import { type Interceptable } from "undici";

// Import Internal Dependencies
import { request } from "../../src/index.ts";
import { createMockPool, kMockUrl as kUrl } from "../helpers/mockPool.ts";

// CONSTANTS
const kAsyncGzip = promisify(gzip);

// VARS
let pool: Interceptable;

before(() => {
  pool = createMockPool();
});

describe("RAW mode", () => {
  describe("GET", () => {
    it("should return a buffer without parsing it even if 'content-type' header exists", async() => {
      const target = { method: "GET", path: "/test" };
      const statusCode = 200;
      const headers = { "content-type": "text/klsmdkf" };
      const payload = Buffer.from("payload");

      pool.intercept(target).reply(statusCode, payload, { headers });

      const response = await request(target.method as any, kUrl + target.path, { mode: "raw" });

      assert.deepStrictEqual(response.data, payload);
      assert.deepStrictEqual(response.headers, headers);
      assert.strictEqual(response.statusCode, 200);
    });

    it("should return a buffer without decompress it even if 'content-encoding' header exists", async() => {
      const target = { method: "GET", path: "/test" };
      const statusCode = 200;
      const headers = { "content-encoding": "gzip" };
      const payload = await kAsyncGzip("Doc");

      pool.intercept(target).reply(statusCode, payload, { headers });

      const response = await request(target.method as any, kUrl + target.path, { mode: "raw" });

      assert.deepStrictEqual(response.data, payload);
      assert.deepStrictEqual(response.headers, headers);
      assert.strictEqual(response.statusCode, 200);
    });
  });

  for (const method of ["POST", "PUT", "DELETE"] as const) {
    describe(method, () => {
      it("should return a buffer without parsing it even if 'content-type' header exists", async() => {
        const target = { method, path: "/test" };
        const statusCode = 200;
        const headers = { "content-type": "text/klsmdkf" };
        const payload = Buffer.from("payload");

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path, { mode: "raw" });

        assert.deepStrictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
        assert.strictEqual(response.statusCode, 200);
      });

      it("should return a buffer without decompress it even if 'content-encoding' header exists", async() => {
        const target = { method, path: "/test" };
        const statusCode = 200;
        const headers = { "content-encoding": "gzip" };
        const payload = await kAsyncGzip("Doc");

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path, { mode: "raw" });

        assert.deepStrictEqual(response.data, payload);
        assert.deepStrictEqual(response.headers, headers);
        assert.strictEqual(response.statusCode, 200);
      });
    });
  }
});
