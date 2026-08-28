/* eslint-disable max-classes-per-file */

// Import Internal Dependencies
import {
  HttpieError,
  type HttpieErrorOptions
} from "./HttpieCommonError.js";

interface HttpieHandlerErrorOptions<
  T extends string = string
> extends HttpieErrorOptions {
  error?: Error;
  message: T;
}

interface HttpieDecompressionErrorOptions extends HttpieHandlerErrorOptions<
  "UnexpectedDecompressionError" | "DecompressionNotSupported"
> {
  buffer: Buffer;
  encodings: string[];
}

interface HttpieParserErrorOptions extends HttpieHandlerErrorOptions<
  "ResponseParsingError"
> {
  contentType: string;
  buffer: Buffer;
  text: string | null;
}

class HttpieHandlerError extends HttpieError {
  reason: Error | null;

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

export class HttpieDecompressionError extends HttpieHandlerError {
  buffer: Buffer;
  encodings: string[];

  constructor(
    options: HttpieDecompressionErrorOptions,
    encoding?: string
  ) {
    super(
      options.message === "DecompressionNotSupported" ?
        `Unsupported encoding '${encoding}'.` :
        `An unexpected error occurred when trying to decompress the response body (reason: '${options.error?.message}').`,
      options
    );

    this.buffer = options.buffer;
    this.encodings = options.encodings;
  }
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
