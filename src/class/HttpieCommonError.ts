// Import Third-party Dependencies
import { type IncomingHttpHeaders } from "undici/types/header.js";

type CommonResponseData = {
  statusCode: number;
  headers: IncomingHttpHeaders;
};

export interface HttpieErrorOptions {
  response: CommonResponseData;
}

export class HttpieError extends Error {
  headers: IncomingHttpHeaders;
  statusCode: number;

  constructor(message: string, options: HttpieErrorOptions) {
    super(message);

    this.statusCode = options.response.statusCode;
    this.headers = options.response.headers;
  }
}
