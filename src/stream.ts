// Import Node.js Dependencies
import { Duplex } from "node:stream";

// Import Third-party Dependencies
import * as undici from "undici";

// Import Internal Dependencies
import {
  type RequestOptions,
  type HttpMethod,
  type WebDavMethod
} from "./request.js";
import { computeURI } from "./agents.js";
import * as Utils from "./utils.js";

export type StreamOptions = Omit<RequestOptions, "limit">;

export function pipeline(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: StreamOptions = {}
): Duplex {
  const computedURI = computeURI(method, uri);
  if (typeof options.querystring !== "undefined") {
    const qs = typeof options.querystring === "string" ? new URLSearchParams(options.querystring) : options.querystring;
    for (const [key, value] of qs.entries()) {
      computedURI.url.searchParams.set(key, value);
    }
  }

  const dispatcher = options.agent ?? computedURI.agent ?? void 0;
  const headers = Utils.createHeaders({ headers: options.headers, authorization: options.authorization });
  const body = Utils.createBody(options.body, headers);

  return undici.pipeline(computedURI.url, {
    method: method as HttpMethod, headers, body, dispatcher
  }, ({ body }) => body);
}

export type WritableStreamCallback = (
  factory: undici.Dispatcher.StreamFactory
) => Promise<undici.Dispatcher.StreamData>;

export function stream(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: StreamOptions = {}
): WritableStreamCallback {
  const computedURI = computeURI(method, uri);

  const dispatcher = options.agent ?? computedURI.agent ?? void 0;
  const headers = Utils.createHeaders({ headers: options.headers, authorization: options.authorization });
  const body = Utils.createBody(options.body, headers);

  return (factory) => undici
    .stream(
      computedURI.url,
      { method: method as HttpMethod, headers, body, dispatcher },
      factory
    );
}
