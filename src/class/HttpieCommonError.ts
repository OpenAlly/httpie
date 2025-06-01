// Import Node.js Dependencies
import type { IncomingHttpHeaders } from "node:http";

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
