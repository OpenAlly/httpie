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
  Client
} from "undici";

setGlobalDispatcher(
  new Agent().compose(interceptors.redirect())
);

export * from "./request.js";
export * from "./stream.js";
export { agents, computeURI, type CustomHttpAgent } from "./agents.js";
export { DEFAULT_HEADER, isHTTPError, isHttpieError } from "./utils.js";
export { HttpieOnHttpError } from "./class/HttpieOnHttpError.js";
export * from "./class/undiciResponseHandler.js";

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
  Client
};
