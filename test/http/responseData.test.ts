// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { getResponseData } from "../../src/http/responseData.ts";
import { toArrayBuffer } from "../helpers/buffer.ts";

describe("getResponseData", () => {
  it("should return the parsed payload by default", async() => {
    const payload = { foo: "bar" };
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(JSON.stringify(payload))) },
      headers: { "content-type": "application/json" }
    };
    const data = await getResponseData(mockResponse as any);

    assert.deepEqual(data, payload);
  });
});

describe("getResponseData (mode: 'raw')", () => {
  it("should return the rawBuffer", async() => {
    const payload = Buffer.from(JSON.stringify({ foo: "bar" }));
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(payload) },
      headers: { "content-type": "application/json" }
    };
    const data = await getResponseData(mockResponse as any, "raw");

    assert.deepEqual(data, payload);
  });

  it("must not decompress the body even when a 'content-encoding' header is set", async() => {
    const payload = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(payload) },
      headers: { "content-encoding": "gzip" }
    };
    const data = await getResponseData(mockResponse as any, "raw");

    assert.deepEqual(data, payload);
  });

  it("should throw HttpieFetchBodyError", async(t) => {
    t.plan(4);

    const errMsg = "unexpected error";
    const mockResponse = {
      statusCode: 200,
      body: {
        arrayBuffer: () => {
          throw new Error(errMsg);
        }
      },
      headers: { "content-type": "application/json" }
    };
    try {
      await getResponseData(mockResponse as any);
    }
    catch (error: any) {
      t.assert.equal(error.name, "ResponseFetchError");
      t.assert.equal(
        error.message,
        `An unexpected error occurred while trying to retrieve the response body (reason: '${errMsg}').`
      );
      t.assert.equal(error.statusCode, mockResponse.statusCode);
      t.assert.deepEqual(error.headers, mockResponse.headers);
    }
  });
});
