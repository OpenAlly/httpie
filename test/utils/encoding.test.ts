// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { getEncodingCharset } from "../../src/utils/encoding.js";

describe("getEncodingCharset", () => {
  it("should return 'utf-8' if no value is provided", () => {
    assert.strictEqual(getEncodingCharset(), "utf-8");
  });

  it("should return 'utf-8' if the provided charset is not known", () => {
    assert.strictEqual(getEncodingCharset("bolekeole"), "utf-8");
  });

  it("should return 'latin1' if the charset is equal to 'ISO-8859-1'", () => {
    assert.strictEqual(getEncodingCharset("ISO-8859-1"), "latin1");
  });

  it("should return the charset unchanged (only if the charset is a valid BufferEncoding)", () => {
    assert.strictEqual(getEncodingCharset("ascii"), "ascii");
  });
});
