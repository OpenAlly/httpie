// Import Node.js Dependencies
import { Duplex } from "node:stream";

// Import Third-party Dependencies
import * as undici from "undici";

// Import Internal Dependencies
import {
  type RequestOptions,
  type HttpMethod,
  type WebDavMethod
} from "../types.js";
import { prepareRequest } from "./dispatch.js";

export type StreamOptions<TOpaque = null> = Omit<RequestOptions, "limit"> & {
  opaque?: TOpaque;
};

export function pipeline<TOpaque = null>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: StreamOptions<TOpaque> = {}
): Duplex {
  const {
    url,
    options: requestOptions
  } = prepareRequest(method, uri, options);

  return undici.pipeline(
    url,
    requestOptions,
    ({ body }) => body
  );
}

export type WritableStreamCallback<TOpaque = null> = (
  factory: undici.Dispatcher.StreamFactory<TOpaque>
) => Promise<undici.Dispatcher.StreamData<TOpaque>>;

export function stream<TOpaque = null>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: StreamOptions<TOpaque> = {}
): WritableStreamCallback<TOpaque> {
  const {
    url,
    options: requestOptions
  } = prepareRequest(method, uri, options);

  return (factory) => undici.stream<TOpaque>(
    url,
    requestOptions,
    factory
  );
}
