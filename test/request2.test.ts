// Import Node.js Dependencies
import { describe, it, before } from "node:test";
import { brotliCompress, deflate, gzip } from "node:zlib";
import { promisify } from "node:util";
import { randomInt } from "node:crypto";
import assert from "node:assert";

// Import Third-party Dependencies
import { Interceptable, MockAgent, setGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { HttpMethod, isHTTPError, isHttpieError, request } from "../src/index.js";

// CONSTANTS
const kUrl = "http://com";
const kAsyncGzip = promisify(gzip);
const kAsyncBrotli = promisify(brotliCompress);
const kAsyncDeflate = promisify(deflate);

// VARS
let pool: Interceptable;

describe("Httpie.safeRequest", () => {
  before(() => {
    const mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();

    pool = mockAgent.get(kUrl);
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
});
