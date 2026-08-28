// Import Node.js Dependencies
import { STATUS_CODES } from "node:http";

// Import Third-party Dependencies
import * as undici from "undici";
import {
  type Result,
  wrapAsync
} from "@openally/result";

// Import Internal Dependencies
import { prepareRequest } from "./dispatch.js";
import { HttpieResponseHandler } from "./responseHandler.js";
import {
  HttpieOnHttpError,
  type HttpieDecompressionError,
  type HttpieFetchBodyError,
  type HttpieParserError
} from "../errors/index.js";
import {
  type HttpMethod,
  type RequestOptions,
  type RequestResponse,
  type WebDavMethod
} from "../types.js";

export type RequestError<T> =
  HttpieOnHttpError<RequestResponse<T>> |
  HttpieDecompressionError |
  HttpieFetchBodyError |
  HttpieParserError;

/**
 * @description httpie "like" request wrapper that use new Node.js http client undici under the hood.
 * @see https://github.com/nodejs/undici
 *
 * @example
 * const { statusCode, data } = await request("GET", "https://ws-dev.myunisoft.fr/ws_monitoring");
 * console.log(statusCode, data); // 200 "true"
 */
export async function request<T>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: RequestOptions = {}
): Promise<RequestResponse<T>> {
  const {
    url,
    limit,
    options: requestOptions
  } = prepareRequest(method, uri, options);

  const requestResponse = limit === null ?
    await undici.request(url, requestOptions) :
    await limit(() => undici.request(url, requestOptions));

  const statusCode = requestResponse.statusCode;
  const responseHandler = new HttpieResponseHandler(requestResponse);

  const data = await responseHandler.getData<T>(options.mode ?? "parse") as T;

  const RequestResponse = {
    headers: requestResponse.headers,
    statusMessage: STATUS_CODES[requestResponse.statusCode] ?? "Unknown Status",
    statusCode,
    data
  };

  const shouldThrowOnHttpError = options.throwOnHttpError ?? true;
  if (shouldThrowOnHttpError && statusCode >= 400) {
    throw new HttpieOnHttpError(RequestResponse);
  }

  return RequestResponse;
}

export async function safeRequest<T, E>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options: RequestOptions = {}
): Promise<Result<RequestResponse<T>, RequestError<E>>> {
  return wrapAsync<RequestResponse<T>, RequestError<E>>(
    () => request(method, uri, options)
  );
}

export type RequestCallback = <T>(
  uri: string | URL, options?: RequestOptions
) => Promise<RequestResponse<T>>;
export type SafeRequestCallback = <T, E>(
  uri: string | URL, options?: RequestOptions
) => Promise<Result<RequestResponse<T>, RequestError<E>>>;

export const get = request.bind(null, "GET") as RequestCallback;
export const post = request.bind(null, "POST") as RequestCallback;
export const put = request.bind(null, "PUT") as RequestCallback;
export const del = request.bind(null, "DELETE") as RequestCallback;
export const patch = request.bind(null, "PATCH") as RequestCallback;

export const safeGet = safeRequest.bind(null, "GET") as SafeRequestCallback;
export const safePost = safeRequest.bind(null, "POST") as SafeRequestCallback;
export const safePut = safeRequest.bind(null, "PUT") as SafeRequestCallback;
export const safeDel = safeRequest.bind(null, "DELETE") as SafeRequestCallback;
export const safePatch = safeRequest.bind(null, "PATCH") as SafeRequestCallback;
