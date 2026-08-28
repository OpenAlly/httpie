// Import Internal Dependencies
import {
  type HttpieError,
  kHttpieErrorBrand
} from "./HttpieError.js";
import { type HttpieOnHttpError } from "./HttpieOnHttpError.js";
import { type RequestResponse } from "../types.js";

export function isHttpieError(
  error: unknown
): error is HttpieError {
  return typeof (error as HttpieError)?.[kHttpieErrorBrand] === "string";
}

export function isHTTPError<
  T extends RequestResponse<any> = RequestResponse<any>
>(
  error: unknown
): error is HttpieOnHttpError<T> {
  return (error as HttpieError)?.[kHttpieErrorBrand] === "HttpieOnHttpError";
}
