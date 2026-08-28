// Import Node.js Dependencies
import type { IncomingHttpHeaders } from "node:http";

type CommonResponseData = {
  statusCode: number;
  headers: IncomingHttpHeaders;
};

export interface HttpieErrorOptions {
  response: CommonResponseData;
}

/**
 * @description Registered symbol used to brand every error produced by httpie.
 * A registered symbol is shared by every realm and every duplicated copy of the
 * package, so the type guards keep working where `instanceof` would fail.
 */
export const kHttpieErrorBrand = Symbol.for("@openally/httpie.error");

export type HttpieErrorKind =
  | "HttpieError"
  | "HttpieOnHttpError"
  | "HttpieHandlerError";

export class HttpieError extends Error {
  headers: IncomingHttpHeaders;
  statusCode: number;

  get [kHttpieErrorBrand](): HttpieErrorKind {
    return "HttpieError";
  }

  constructor(message: string, options: HttpieErrorOptions) {
    super(message);

    this.statusCode = options.response.statusCode;
    this.headers = options.response.headers;
  }
}
