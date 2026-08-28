// Import Internal Dependencies
import {
  HttpieError,
  kHttpieErrorBrand,
  type HttpieErrorKind,
  type HttpieErrorOptions
} from "./HttpieError.js";

export interface HttpieHandlerErrorOptions<
  T extends string = string
> extends HttpieErrorOptions {
  error?: Error;
  message: T;
}

export class HttpieHandlerError extends HttpieError {
  reason: Error | null;

  override get [kHttpieErrorBrand](): HttpieErrorKind {
    return "HttpieHandlerError";
  }

  constructor(
    message: string,
    options: HttpieHandlerErrorOptions
  ) {
    super(
      message,
      options
    );

    this.name = options.message;
    this.reason = options.error ?? null;
  }
}
