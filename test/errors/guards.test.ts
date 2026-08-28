// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";
import vm from "node:vm";

// Import Internal Dependencies
import { isHTTPError, isHttpieError } from "../../src/errors/guards.ts";
import { HttpieOnHttpError } from "../../src/errors/HttpieOnHttpError.ts";
import { HttpieDecompressionError } from "../../src/errors/HttpieDecompressionError.ts";
import { HttpieFetchBodyError } from "../../src/errors/HttpieFetchBodyError.ts";
import { HttpieParserError } from "../../src/errors/HttpieParserError.ts";

describe("isHttpieError", () => {
  it("it should be true", () => {
    assert.strictEqual(
      isHttpieError(new HttpieOnHttpError({} as any)),
      true
    );
    assert.strictEqual(
      isHttpieError(new HttpieFetchBodyError({ message: "ResponseFetchError", response: {} } as any)),
      true
    );
    assert.strictEqual(
      isHttpieError(new HttpieDecompressionError({ message: "UnexpectedDecompressionError", response: {} } as any)),
      true
    );
    assert.strictEqual(
      isHttpieError(new HttpieParserError({ message: "ResponseParsingError", response: {} } as any)),
      true
    );
  });

  it("it should be false", () => {
    assert.strictEqual(isHttpieError(new Error()), false);
  });
});

describe("isHTTPError", () => {
  it("it should be true", () => {
    assert.strictEqual(isHTTPError(new HttpieOnHttpError({} as any)), true);
  });

  it("it should be false", () => {
    assert.strictEqual(isHTTPError(new Error()), false);
    assert.strictEqual(
      isHTTPError(new HttpieFetchBodyError({ message: "ResponseFetchError", response: {} } as any)),
      false
    );
    assert.strictEqual(
      isHTTPError(new HttpieDecompressionError({ message: "UnexpectedDecompressionError", response: {} } as any)),
      false
    );
    assert.strictEqual(
      isHTTPError(new HttpieParserError({ message: "ResponseParsingError", response: {} } as any)),
      false
    );
  });
});

describe("cross-realm error branding", () => {
  const foreignError = vm.runInNewContext(`
    class ForeignHttpieError extends Error {
      get [Symbol.for("@openally/httpie.error")]() {
        return "HttpieOnHttpError";
      }
    }

    new ForeignHttpieError("cross-realm");
  `);

  it("it should not be recognized by instanceof", () => {
    assert.strictEqual(foreignError instanceof HttpieOnHttpError, false);
  });

  it("it should still be recognized by the type guards", () => {
    assert.strictEqual(isHttpieError(foreignError), true);
    assert.strictEqual(isHTTPError(foreignError), true);
  });
});
