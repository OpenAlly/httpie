// Import Node.js Dependencies
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import { FastifyInstance } from "fastify";
import isHtml from "is-html";

// Import Internal Dependencies
import {
  get, post, put, patch, del, safeGet,
  Agent, interceptors
} from "../src/index.js";
import { isHTTPError } from "../src/utils.js";
import { createServer } from "./server/index.js";
import { windev } from "./helpers.js";

let httpServer: FastifyInstance;
before(async() => {
  httpServer = await createServer();
});

after(async() => {
  await httpServer.close();
});

describe("http.get", () => {
  it("should GET uptime from local fastify server", async() => {
    const { data } = await get<{ uptime: number; }>("/local/");

    assert.ok("uptime" in data);
    assert.equal(typeof data.uptime, "number");
  });

  it("should GET query parameters provided to fastify", async() => {
    const { data } = await get<{ name: string; }>("/local/qs", {
      querystring: new URLSearchParams({
        name: "foobar"
      })
    });

    assert.ok("name" in data);
    assert.equal(data.name, "foobar");
  });

  it("should GET uptime by following an HTTP redirection from local fastify server", async() => {
    const agent = new Agent()
      .compose(interceptors.redirect({ maxRedirections: 2 }));
    const { data } = await get<{ uptime: number; }>("/local/redirect", {
      agent
    });

    assert.ok("uptime" in data);
    assert.equal(typeof data.uptime, "number");
  });

  it("should GET uptime through a limit function handler from local fastify server", async() => {
    let executed = false;
    // eslint-disable-next-line func-style
    const limit = (callback) => {
      executed = true;

      return callback();
    };
    const { data } = await get<{ uptime: number; }>("/local/", { limit });

    assert.ok("uptime" in data);
    assert.equal(typeof data.uptime, "number");
    assert.equal(executed, true);
  });

  it("should GET response from windev ws-monitoring endpoint (without Agent)", async() => {
    const { data } = await get<string>("/windev/ws_monitoring");

    assert.equal(data, true);
  });

  it("should GET response from windev ws-monitoring endpoint (with Agent)", async() => {
    const { data } = await get<string>("/windev/ws_monitoring", {
      agent: windev.agent
    });

    assert.equal(data, true);
  });

  it("should GET json response from node.js health endpoint", async() => {
    const { data } = await get<any>("https://app.dev.myunisoft.tech/api/authenticate/healthz");

    assert.deepEqual(Object.keys(data).sort(), [
      "status", "version", "description", "checks"
    ].sort());
  });

  it("should throw a 404 Not Found error because the path is not known", async(t) => {
    t.plan(4);

    try {
      await get<string>("/windev/hlkezcjcke");
    }
    catch (error: any) {
      t.assert.equal(error.name, "HttpieOnHttpError");
      t.assert.equal(error.statusCode, 404);
      t.assert.equal(error.statusMessage, "Not Found");
      t.assert.equal(isHtml(error.data), true);
    }
  });

  it("should throw a 'HttpieParserError' with jsonError endpoint from local fastify server", async(t) => {
    t.plan(4);

    const expectedPayload = "{ 'foo': bar }";
    try {
      await get<string>("/local/jsonError");
    }
    catch (error: any) {
      t.assert.equal(error.name, "ResponseParsingError");
      t.assert.equal(error.reason.name, "SyntaxError");
      t.assert.equal(error.text, expectedPayload);
      t.assert.equal(Buffer.from(expectedPayload).compare(error.buffer), 0);
    }
  });
});

/**
 * @see https://jsonplaceholder.typicode.com/guide/
 */
describe("http.post", () => {
  it("should POST data on jsonplaceholder API", async() => {
    const body = {
      title: "foo",
      body: "bar",
      userId: 1
    };

    const { data } = await post<typeof body & { userId: number; }>("https://jsonplaceholder.typicode.com/posts", { body });
    assert.equal(typeof data.userId, "number");
    assert.partialDeepStrictEqual(data, body);
  });
});

describe("http.put", () => {
  it("should PUT data on jsonplaceholder API", async() => {
    const body = {
      id: 1,
      title: "foo",
      body: "bar",
      userId: 1
    };

    const { data } = await put<typeof body & { userId: number; }>("https://jsonplaceholder.typicode.com/posts/1", { body });
    assert.deepEqual(data, body);
  });
});

describe("http.patch", () => {
  it("should PATCH data on jsonplaceholder API", async() => {
    const body = {
      id: 1,
      title: "foo",
      userId: 1
    };

    const { data } = await patch<typeof body & { userId: number; }>("https://jsonplaceholder.typicode.com/posts/1", {
      body: { title: "foo" }
    });
    assert.partialDeepStrictEqual(data, body);
  });
});

describe("http.del", () => {
  it("should DELETE data on jsonplaceholder API", async() => {
    const { statusCode } = await del<any>("https://jsonplaceholder.typicode.com/posts/1", {
      body: { title: "foo" }
    });
    assert.equal(statusCode, 200);
  });
});

describe("http.safeGet", () => {
  it("should GET uptime from local fastify server", async() => {
    const result = await safeGet<{ uptime: number; }, any>("/local/");

    assert.ok(result.ok);
    const { data } = result.unwrap();
    assert.ok("uptime" in data);
    assert.equal(typeof data.uptime, "number");
  });

  it("should throw a 404 Not Found error because the path is not known", async(t) => {
    t.plan(4);

    const result = await safeGet<string, any>("/windev/hlkezcjcke");
    assert.ok(result.err);

    if (result.err) {
      const error = result.val;

      if (isHTTPError(error)) {
        t.assert.equal(error.name, "HttpieOnHttpError");
        t.assert.equal(error.statusCode, 404);
        t.assert.equal(error.statusMessage, "Not Found");
        t.assert.equal(isHtml(error.data), true);
      }
    }
  });
});
