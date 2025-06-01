// Import Node.js Dependencies
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import { FastifyInstance } from "fastify";

// Import Internal Dependencies
import { retry, get, policies } from "../src/index.js";
import { createServer } from "./server/index.js";

let httpServer: FastifyInstance;
before(async() => {
  httpServer = await createServer("retry", 1337);
});

after(async() => {
  await httpServer.close();
});

describe("retry (with default policy)", () => {
  it("should throw an Error because the number of retries has been exceeded", async(t) => {
    t.plan(1);

    try {
      await retry(() => {
        throw new Error("exceed");
      }, { factor: 1 });
    }
    catch (error: any) {
      t.assert.equal(error.message, "Exceeded the maximum number of allowed retries!");
    }
  });

  it("should succeed after one try", async() => {
    let count = 0;

    const { data, metrics } = await retry<string>(() => {
      count++;
      if (count === 1) {
        throw new Error("oops");
      }

      return "hello world!";
    });

    assert.equal(data, "hello world!");
    assert.equal(metrics.attempt, 1);
    assert.equal(typeof metrics.elapsedTimeoutTime, "number");
    assert.equal(typeof metrics.executionTimestamp, "number");
  });

  it("should be stopped with Node.js AbortController", async(t) => {
    t.plan(1);

    let count = 0;
    const controller = new AbortController();

    try {
      await retry(() => {
        count++;
        if (count <= 2) {
          throw new Error("oops");
        }
        controller.abort();

        throw new Error("oops");
      }, { forever: true, signal: controller.signal });
    }
    catch (error: any) {
      t.assert.equal(error.message, "Aborted");
    }
  });
});

describe("retry (with http policy)", () => {
  it("should throw an Error because the number of retries has been exceeded", async(t) => {
    t.plan(1);

    try {
      await retry(async() => get("/retry/internalerror"), { factor: 1, retries: 2 }, policies.httpcode());
    }
    catch (error: any) {
      t.assert.equal(error.message, "Exceeded the maximum number of allowed retries!");
    }
  });

  it("should return the http error because the code (501) is not supported by the policy", async(t) => {
    t.plan(1);

    try {
      await retry(async() => get("/retry/notimplemented"), { factor: 1, retries: 2 }, policies.httpcode());
    }
    catch (error: any) {
      t.assert.equal(error.message, "Not Implemented");
    }
  });

  it("should include code 501 and all other default port", async(t) => {
    t.plan(1);

    try {
      const policy = policies.httpcode(new Set([501]), true);

      await retry(async() => get("/retry/notimplemented"), { factor: 1, retries: 2 }, policy);
    }
    catch (error: any) {
      t.assert.equal(error.message, "Exceeded the maximum number of allowed retries!");
    }
  });
});
