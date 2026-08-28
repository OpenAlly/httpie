// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { getResponseData } from "../../src/http/responseData.ts";
import { toArrayBuffer } from "../helpers/buffer.ts";

describe("getResponseData (mode: 'parse')", () => {
  it("should parse a JSON response with no errors", async() => {
    const payload = { foo: "bar" };
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(JSON.stringify(payload))) },
      headers: { "content-type": "application/json" }
    };
    const data = await getResponseData(mockResponse as any, "parse");

    assert.deepEqual(data, payload);
  });

  it("should parse an invalid JSON response but still keep the request data in the Error", async(t) => {
    t.plan(5);

    const payload = "{\"foo\": bar}";
    const buf = Buffer.from("{\"foo\": bar}");

    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(payload)) },
      headers: { "content-type": "application/json" }
    };
    try {
      await getResponseData(mockResponse as any, "parse");
    }
    catch (error: any) {
      t.assert.equal(error.text, payload);
      t.assert.deepEqual(error.buffer, buf);
      t.assert.equal(error.name, "ResponseParsingError");
      t.assert.equal(error.statusCode, mockResponse.statusCode);
      t.assert.deepEqual(error.headers, mockResponse.headers);
    }
  });

  it("should return the original buffer when there is no content-type", async() => {
    const payload = Buffer.from("hello world!");

    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(payload) },
      headers: {}
    };
    const data = await getResponseData(mockResponse as any, "parse");

    assert.deepEqual(data, payload);
  });

  it("must converting it to a string when the 'content-type' header starts with 'text/'", async() => {
    const payload = "hello world!";
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(payload)) },
      headers: { "content-type": "text/anything" }
    };
    const data = await getResponseData(mockResponse as any, "parse");

    assert.deepEqual(data, payload);
  });

  it("must converting body to JSON when the 'content-type' header is set with 'application/json'", async() => {
    const payload = { foo: "hello world!" };

    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(Buffer.from(JSON.stringify(payload))) },
      headers: { "content-type": "application/json; charset=utf-8" }
    };
    const data = await getResponseData(mockResponse as any, "parse");

    assert.deepEqual(data, payload);
  });

  it("must return the original buffer when 'content-type' header is set with 'application/pdf'", async() => {
    const buf = Buffer.from("hello world!");
    const mockResponse = {
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-type": "application/pdf" }
    };

    const data = await getResponseData(mockResponse as any, "parse");

    assert.deepEqual(data, buf);
  });
});

describe("getResponseData (mode: 'parse') with an invalid 'content-type'", () => {
  it("must throw a ResponseParsingError with a null text", async(t) => {
    t.plan(3);

    const buf = Buffer.from("hello world!");
    const mockResponse = {
      statusCode: 200,
      body: { arrayBuffer: () => toArrayBuffer(buf) },
      headers: { "content-type": "foobar" }
    };

    try {
      await getResponseData(mockResponse as any, "parse");
    }
    catch (error: any) {
      t.assert.equal(error.name, "ResponseParsingError");
      t.assert.equal(error.text, null);
      t.assert.deepEqual(error.buffer, buf);
    }
  });
});
