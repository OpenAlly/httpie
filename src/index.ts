// Import Third-party Dependencies
import {
  Agent,
  ProxyAgent,
  interceptors,
  fetch,
  setGlobalDispatcher,
  getGlobalDispatcher,
  Headers,
  type HeadersInit,
  FormData,
  type BodyInit,
  MockAgent,
  mockErrors,
  MockPool,
  type Interceptable,
  type Dispatcher,
  Client
} from "undici";

setGlobalDispatcher(
  new Agent().compose(interceptors.redirect())
);

export * from "./types.ts";
export * from "./http/request.ts";
export * from "./http/stream.ts";
export {
  HttpieResponseHandler,
  type TypeOfDecompression
} from "./http/responseHandler.ts";
export {
  agents,
  computeURI,
  type CustomHttpAgent
} from "./agents/index.ts";
export { DEFAULT_HEADER } from "./utils/headers.ts";
export {
  HttpieOnHttpError,
  isHTTPError,
  isHttpieError
} from "./errors/index.ts";

export {
  Agent,
  ProxyAgent,
  interceptors,
  fetch,
  setGlobalDispatcher,
  getGlobalDispatcher,
  Headers,
  type HeadersInit,
  FormData,
  type BodyInit,
  MockAgent,
  mockErrors,
  MockPool,
  type Interceptable,
  type Dispatcher,
  Client
};
