// Import Node.js Dependencies
import { type IncomingHttpHeaders } from "node:http";
import { URLSearchParams } from "node:url";

// Import Third-party Dependencies
import * as undici from "undici";

// Import Internal Dependencies
import { createHeaders } from "../utils/headers.ts";
import { createBody } from "../utils/body.ts";
import { computeURI } from "../agents/computeURI.ts";
import {
  type RequestOptions,
  type InlineCallbackAction,
  type HttpMethod,
  type WebDavMethod
} from "../types.ts";

export interface DispatchOptions {
  method: HttpMethod;
  headers: IncomingHttpHeaders;
  body: any;
  dispatcher: undici.Dispatcher | undefined;
  blocking: boolean | undefined;
}

export interface PreparedRequest {
  url: URL;
  limit: InlineCallbackAction | null;
  options: DispatchOptions;
}

/**
 * Resolve an URI to its URL, agent and rate limiter, then build the options for an undici dispatch.
 */
export function prepareRequest(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: RequestOptions
): PreparedRequest {
  const computedURI = computeURI(uri);
  if (typeof options.querystring !== "undefined") {
    const qs = typeof options.querystring === "string"
      ? new URLSearchParams(options.querystring)
      : options.querystring;

    for (const [key, value] of qs.entries()) {
      computedURI.url.searchParams.set(key, value);
    }
  }

  const headers = createHeaders({
    headers: options.headers,
    authorization: options.authorization
  });

  return {
    url: computedURI.url,
    limit: options.limit ?? computedURI.limit ?? null,
    options: {
      method: method as HttpMethod,
      headers,
      body: createBody(options.body, headers),
      dispatcher: options.agent ?? computedURI.agent ?? void 0,
      blocking: options.blocking
    }
  };
}
