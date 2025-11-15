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

export type StreamOptions<TOpaque = null> = Omit<RequestOptions, "limit"> & {
  opaque?: TOpaque;
};

export function pipeline<TOpaque = null>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: StreamOptions<TOpaque> = {}
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
    method: method as HttpMethod,
    headers,
    body,
    dispatcher,
    blocking: options.blocking
  }, ({ body }) => body);
}

export type WritableStreamCallback<TOpaque = null> = (
  factory: undici.Dispatcher.StreamFactory<TOpaque>
) => Promise<undici.Dispatcher.StreamData<TOpaque>>;

export function stream<TOpaque = null>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: StreamOptions<TOpaque> = {}
): WritableStreamCallback<TOpaque> {
  const computedURI = computeURI(method, uri);

  const dispatcher = options.agent ?? computedURI.agent ?? void 0;
  const headers = Utils.createHeaders({ headers: options.headers, authorization: options.authorization });
  const body = Utils.createBody(options.body, headers);

  return (factory) => undici
    .stream<TOpaque>(
      computedURI.url,
      { method: method as HttpMethod, headers, body, dispatcher },
      factory
    );
}
