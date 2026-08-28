// Import Internal Dependencies
import {
  type HttpieError,
  kHttpieErrorBrand
} from "./HttpieError.ts";
import { type HttpieOnHttpError } from "./HttpieOnHttpError.ts";
import { type RequestResponse } from "../types.ts";

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
