// Import Node.js Dependencies
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { randomInt } from "node:crypto";

// Import Third-party Dependencies
import { type Interceptable } from "undici";

// Import Internal Dependencies
import { isHTTPError, request } from "../../src/index.ts";
import { createMockPool, kMockUrl as kUrl } from "../helpers/mockPool.ts";

// VARS
let pool: Interceptable;

before(() => {
  pool = createMockPool();
});

describe("with ThrowOnHttpError", () => {
  describe("GET", () => {
    it("should throw if the response status code is higher than 400", async(t) => {
      t.plan(4);

      const target = {
        method: "GET",
        path: "/test"
      };

      const statusCode = randomInt(400, 503);
      const headers = { "content-type": "text/html" };
      const payload = Buffer.from("Body");

      pool.intercept(target).reply(statusCode, payload, { headers });

      try {
        await request(target.method as any, kUrl + target.path);
      }
      catch (error: any) {
        t.assert.equal(isHTTPError(error), true);
        t.assert.equal(error.statusCode, statusCode);
        t.assert.equal(error.data, payload.toString());
        t.assert.deepEqual(error.headers, headers);
      }
    });

    it("should not throw if the response status code is lower than 400", async() => {
      const target = {
        method: "GET",
        path: "/test"
      };

      const statusCode = randomInt(200, 399);
      const headers = { "content-type": "text/html" };
      const payload = Buffer.from("Body");

      pool.intercept(target).reply(statusCode, payload, { headers });

      const response = await request(target.method as any, kUrl + target.path);

      assert.strictEqual(response.statusCode, statusCode);
      assert.strictEqual(response.data, payload.toString());
      assert.deepStrictEqual(response.headers, headers);
    });
  });

  for (const method of ["POST", "PUT", "DELETE"] as const) {
    describe(method, () => {
      it("should throw if the response status code is higher than 400", async() => {
        const target = { method, path: "/test" };
        const statusCode = randomInt(400, 503);
        const headers = { "content-type": "text/html" };
        const payload = Buffer.from("Body");

        pool.intercept(target).reply(statusCode, payload, { headers });

        try {
          await request(target.method, kUrl + target.path);
          assert.fail("Expected an error to be thrown");
        }
        catch (error: any) {
          assert.ok(isHTTPError(error));
          assert.strictEqual(error.statusCode, statusCode);
          assert.strictEqual(error.data, payload.toString());
          assert.deepStrictEqual(error.headers, headers);
        }
      });

      it("should not throw if the response status code is lower than 400", async() => {
        const target = { method, path: "/test" };
        const statusCode = randomInt(200, 399);
        const headers = { "content-type": "text/html" };
        const payload = Buffer.from("Body");

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path);

        assert.strictEqual(response.statusCode, statusCode);
        assert.strictEqual(response.data, payload.toString());
        assert.deepStrictEqual(response.headers, headers);
      });
    });
  }
});

describe("without ThrowOnHttpError", () => {
  describe("GET", () => {
    it("should not throw if the response status code is higher than 400", async() => {
      const target = { method: "GET", path: "/test" };
      const statusCode = randomInt(400, 503);
      const headers = { "content-type": "text/html" };
      const payload = Buffer.from("Body");

      pool.intercept(target).reply(statusCode, payload, { headers });

      const response = await request(target.method as any, kUrl + target.path, { throwOnHttpError: false });

      assert.strictEqual(response.statusCode, statusCode);
      assert.strictEqual(response.data, payload.toString());
      assert.deepStrictEqual(response.headers, headers);
    });

    it("should not throw if the response status code is lower than 400", async() => {
      const target = { method: "GET", path: "/test" };
      const statusCode = randomInt(200, 399);
      const headers = { "content-type": "text/html" };
      const payload = Buffer.from("Body");

      pool.intercept(target).reply(statusCode, payload, { headers });

      const response = await request(target.method as any, kUrl + target.path, { throwOnHttpError: false });

      assert.strictEqual(response.statusCode, statusCode);
      assert.strictEqual(response.data, payload.toString());
      assert.deepStrictEqual(response.headers, headers);
    });
  });

  for (const method of ["POST", "PUT", "DELETE"] as const) {
    describe(method, () => {
      it("should not throw if the response status code is higher than 400", async() => {
        const target = { method, path: "/test" };
        const statusCode = randomInt(400, 503);
        const headers = { "content-type": "text/html" };
        const payload = Buffer.from("Body");

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path, { throwOnHttpError: false });

        assert.strictEqual(response.statusCode, statusCode);
        assert.strictEqual(response.data, payload.toString());
        assert.deepStrictEqual(response.headers, headers);
      });

      it("should not throw if the response status code is lower than 400", async() => {
        const target = { method, path: "/test" };
        const statusCode = randomInt(200, 399);
        const headers = { "content-type": "text/html" };
        const payload = Buffer.from("Body");

        pool.intercept(target).reply(statusCode, payload, { headers });

        const response = await request(target.method, kUrl + target.path, { throwOnHttpError: false });

        assert.strictEqual(response.statusCode, statusCode);
        assert.strictEqual(response.data, payload.toString());
        assert.deepStrictEqual(response.headers, headers);
      });
    });
  }
});
