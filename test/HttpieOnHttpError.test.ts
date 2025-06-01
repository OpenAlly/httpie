// Import Node.js Dependencies
import { describe, it } from "node:test";

// Import Third-party Dependencies
import { MockAgent, setGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { request } from "../src/request";

describe("HttpieOnHttpError", () => {
  it("it should create an HttpieOnHttpError with the properties of RequestResponse", async(t) => {
    t.plan(2);

    const expectedResponseData = {
      statusCode: 404,
      statusMessage: "Not Found",
      data: "La data.",
      headers: { "content-type": "text/plain" }
    };
    const url = "http://test.com";
    const targetUrl = {
      method: "GET",
      path: "/test"
    };
    const path = url + targetUrl.path;

    const mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();

    const pool = mockAgent.get(url);
    pool.intercept(targetUrl).reply(expectedResponseData.statusCode, expectedResponseData.data, {
      headers: expectedResponseData.headers
    });

    try {
      await request(targetUrl.method as any, path);
    }
    catch (error: any) {
      const { data, headers, statusCode, statusMessage } = error;

      t.assert.equal(error.name, "HttpieOnHttpError");
      t.assert.deepEqual(
        { data, headers, statusCode, statusMessage },
        expectedResponseData
      );
    }
  });
});
