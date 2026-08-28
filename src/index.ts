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

export * from "./types.js";
export * from "./http/request.js";
export * from "./http/stream.js";
export {
  HttpieResponseHandler,
  type TypeOfDecompression
} from "./http/responseHandler.js";
export {
  agents,
  computeURI,
  type CustomHttpAgent
} from "./agents/index.js";
export { DEFAULT_HEADER } from "./utils/headers.js";
export {
  HttpieOnHttpError,
  isHTTPError,
  isHttpieError
} from "./errors/index.js";

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
