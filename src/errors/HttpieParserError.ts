// Import Internal Dependencies
import {
  HttpieHandlerError,
  type HttpieHandlerErrorOptions
} from "./HttpieHandlerError.ts";

interface HttpieParserErrorOptions extends HttpieHandlerErrorOptions<
  "ResponseParsingError"
> {
  contentType: string;
  buffer: Buffer;
  text: string | null;
}

export class HttpieParserError extends HttpieHandlerError {
  contentType: string;
  buffer: Buffer;
  text: string | null;

  constructor(
    options: HttpieParserErrorOptions
  ) {
    super(
      `An unexpected error occurred when trying to parse the response body (reason: '${options.error?.message}').`,
      options
    );

    this.buffer = options.buffer;
    this.contentType = options.contentType;
    this.text = options.text ?? null;
  }
}
