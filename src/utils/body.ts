// Import Node.js Dependencies
import { type IncomingHttpHeaders } from "node:http";

// Import Internal Dependencies
import { hasHeader, setHeader } from "./headers.ts";

export function isAsyncIterable(
  value: unknown
): value is AsyncIterable<unknown> {
  return typeof (value as AsyncIterable<unknown>)?.[Symbol.asyncIterator] === "function";
}

export function createBody(
  body?: any,
  headers: IncomingHttpHeaders = {}
): string | Buffer | AsyncIterable<unknown> | undefined {
  if (typeof body === "undefined") {
    return void 0;
  }
  if (isAsyncIterable(body)) {
    return body;
  }

  let finalBody = body;
  let contentType: string | null = null;
  if (body instanceof URLSearchParams) {
    finalBody = body.toString();
    contentType = "application/x-www-form-urlencoded";
  }
  else if (typeof body === "object" && !Buffer.isBuffer(body)) {
    finalBody = JSON.stringify(body);
    contentType = "application/json";
  }

  if (contentType !== null && !hasHeader(headers, "content-type")) {
    setHeader(
      headers,
      "content-type",
      contentType
    );
  }
  setHeader(
    headers,
    "content-length",
    String(Buffer.byteLength(finalBody))
  );

  return finalBody;
}
