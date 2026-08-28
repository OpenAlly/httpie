
// Import Node.js Dependencies
import { type IncomingHttpHeaders } from "node:http";

// Import Internal Dependencies
import { type RequestOptions, type RequestResponse } from "./request.js";
import { HttpieError } from "./class/HttpieCommonError.js";
import { HttpieOnHttpError } from "./class/HttpieOnHttpError.js";

// CONSTANTS
const kDefaultUserAgent = "httpie";
const kDefaultEncodingCharset = "utf-8";
const kCharsetConversionTable: Record<string, BufferEncoding> = {
  "ISO-8859-1": "latin1"
};

export const DEFAULT_HEADER = { "user-agent": kDefaultUserAgent };

export function isAsyncIterable(
  value: unknown
): value is AsyncIterable<unknown> {
  return typeof (value as AsyncIterable<unknown>)?.[Symbol.asyncIterator] === "function";
}

/**
 * @description Get a valid Node.js charset from the "content-type" http header.
 * @see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
 */
export function getEncodingCharset(
  charset = kDefaultEncodingCharset
): BufferEncoding {
  if (Buffer.isEncoding(charset)) {
    return charset;
  }

  return kCharsetConversionTable[charset] ?? kDefaultEncodingCharset;
}

/**
 * @description Set a header case-insensitively, removing any existing entry that
 * differs only by casing. HTTP header names are case-insensitive and HTTP/2 forbids
 * singular headers (e.g. `user-agent`) from carrying multiple values, so we must not
 * end up with both `user-agent` and `User-Agent` in the same object.
 */
function setHeader(
  headers: IncomingHttpHeaders,
  name: string,
  value: IncomingHttpHeaders[string]
): void {
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lowerName) {
      delete headers[key];
    }
  }

  headers[name] = value;
}

function hasHeader(
  headers: IncomingHttpHeaders,
  name: string
): boolean {
  const lowerName = name.toLowerCase();

  return Object.keys(headers).some((key) => key.toLowerCase() === lowerName);
}

/**
 * @description Create a default plain Object headers that will contains a Set of default values like:
 * - User-agent
 * - Authorization
 */
export function createHeaders(
  options: Partial<Pick<RequestOptions, "headers" | "authorization">>
): IncomingHttpHeaders {
  const headers: IncomingHttpHeaders = { ...DEFAULT_HEADER };

  for (const [name, value] of Object.entries(options.headers ?? {})) {
    setHeader(
      headers,
      name,
      value
    );
  }

  if (options.authorization) {
    setHeader(
      headers,
      "Authorization",
      createAuthorizationHeader(options.authorization)
    );
  }

  return headers;
}

export function isHttpieError(
  error: unknown
): error is HttpieError {
  return error instanceof HttpieError;
}

export function isHTTPError<
  T extends RequestResponse<any> = RequestResponse<any>
>(
  error: unknown
): error is HttpieOnHttpError<T> {
  return error instanceof HttpieOnHttpError;
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

/**
 * @description Helpers to generate a Basic or Bearer token for the HTTP Authorization header.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
 */
export function createAuthorizationHeader(
  authorizationHeaderValue: string
): string {
  const isBasicAuthToken = authorizationHeaderValue.includes(":");

  return isBasicAuthToken ?
    `Basic ${Buffer.from(authorizationHeaderValue).toString("base64")}` :
    `Bearer ${authorizationHeaderValue}`;
}
