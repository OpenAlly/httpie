// Import Internal Dependencies
import {
  HttpieHandlerError,
  type HttpieHandlerErrorOptions
} from "./HttpieHandlerError.js";

export class HttpieFetchBodyError extends HttpieHandlerError {
  constructor(
    options: HttpieHandlerErrorOptions<"ResponseFetchError">
  ) {
    super(
      `An unexpected error occurred while trying to retrieve the response body (reason: '${options.error?.message}').`,
      options
    );
  }
}
