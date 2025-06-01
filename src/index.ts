// Import Third-party Dependencies
import {
  Agent,
  ProxyAgent,
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

export * from "./request.js";
export * from "./stream.js";
export * from "./retry.js";
export * as policies from "./policies/index.js";
export { agents, computeURI, type CustomHttpAgent } from "./agents.js";
export { DEFAULT_HEADER, isHTTPError, isHttpieError } from "./utils.js";
export { HttpieOnHttpError } from "./class/HttpieOnHttpError.js";
export * from "./class/undiciResponseHandler.js";

export {
  Agent,
  ProxyAgent,
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
