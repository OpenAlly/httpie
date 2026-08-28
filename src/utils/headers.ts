// Import Node.js Dependencies
import { type IncomingHttpHeaders } from "node:http";

// Import Internal Dependencies
import { type RequestOptions } from "../types.ts";

// CONSTANTS
const kDefaultUserAgent = "httpie";

export const DEFAULT_HEADER = { "user-agent": kDefaultUserAgent };

/**
 * Set a header case-insensitively, removing any existing entry that
 * differs only by casing.
 *
 * HTTP header names are case-insensitive and HTTP/2 forbids
 * singular headers (e.g. `user-agent`) from carrying multiple values, so we must not
 * end up with both `user-agent` and `User-Agent` in the same object.
 */
export function setHeader(
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

export function hasHeader(
  headers: IncomingHttpHeaders,
  name: string
): boolean {
  const lowerName = name.toLowerCase();

  return Object
    .keys(headers)
    .some((key) => key.toLowerCase() === lowerName);
}

/**
 * @description Create a default plain Object headers that will contains a Set of default values like:
 * - User-agent
 * - Authorization
 */
export function createHeaders(
  options: Partial<Pick<RequestOptions, "headers" | "authorization">>
): IncomingHttpHeaders {
  const headers: IncomingHttpHeaders = {
    ...DEFAULT_HEADER
  };

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
