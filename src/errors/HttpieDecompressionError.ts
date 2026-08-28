// Import Internal Dependencies
import {
  HttpieHandlerError,
  type HttpieHandlerErrorOptions
} from "./HttpieHandlerError.ts";

type HttpieDecompressionErrorMessage =
  | "UnexpectedDecompressionError"
  | "DecompressionNotSupported"
  | "TooManyContentEncodings";

interface HttpieDecompressionErrorOptions extends HttpieHandlerErrorOptions<
  HttpieDecompressionErrorMessage
> {
  buffer: Buffer;
  encodings: string[];
}

export class HttpieDecompressionError extends HttpieHandlerError {
  buffer: Buffer;
  encodings: string[];

  constructor(
    options: HttpieDecompressionErrorOptions,
    encoding?: string
  ) {
    super(
      buildMessage(options, encoding),
      options
    );

    this.buffer = options.buffer;
    this.encodings = options.encodings;
  }
}

function buildMessage(
  options: HttpieDecompressionErrorOptions,
  encoding: string | undefined
): string {
  switch (options.message) {
    case "DecompressionNotSupported":
      return `Unsupported encoding '${encoding}'.`;
    case "TooManyContentEncodings":
      return `Too many content-encodings in the response (received: ${options.encodings.length}).`;
    default:
      return `An unexpected error occurred when trying to decompress the response body (reason: '${options.error?.message}').`;
  }
}
