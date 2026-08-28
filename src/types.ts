// Import Node.js Dependencies
import { type IncomingHttpHeaders } from "node:http";
import { type URLSearchParams } from "node:url";

// Import Third-party Dependencies
import type * as undici from "undici";

export type WebDavMethod =
  | "MKCOL"
  | "COPY"
  | "MOVE"
  | "LOCK"
  | "UNLOCK"
  | "PROPFIND"
  | "PROPPATCH";
export type HttpMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";
export type InlineCallbackAction = <T>(fn: () => Promise<T>) => Promise<T>;

export type ModeOfHttpieResponseHandler = "decompress" | "parse" | "raw";

export interface RequestOptions {
  /** @default{ "user-agent": "httpie" } */
  headers?: IncomingHttpHeaders;
  querystring?: string | URLSearchParams;
  body?: any;
  authorization?: string;
  /**
   * Whether the response is expected to take a long time and would end up blocking the pipeline.
   * When this is set to true further pipelining will be avoided on the same connection until headershave been received.
   *
   * Defaults to method !== 'HEAD'.
   */
  blocking?: boolean;
  // Could be dynamically computed depending on the provided URI.
  agent?: undici.Agent | undici.ProxyAgent | undici.MockAgent;
  /** API limiter from a package like `p-ratelimit`. */
  limit?: InlineCallbackAction;
  /** @default "parse" */
  mode?: ModeOfHttpieResponseHandler;
  /** @default true */
  throwOnHttpError?: boolean;
}

export interface RequestResponse<T> {
  data: T;
  headers: IncomingHttpHeaders;
  statusMessage: string;
  statusCode: number;
}
