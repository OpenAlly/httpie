// Import Internal Dependencies
import {
  HttpieHandlerError,
  type HttpieHandlerErrorOptions
} from "./HttpieHandlerError.ts";

interface HttpieDecompressionErrorOptions extends HttpieHandlerErrorOptions<
  "UnexpectedDecompressionError" | "DecompressionNotSupported"
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
      options.message === "DecompressionNotSupported" ?
        `Unsupported encoding '${encoding}'.` :
        `An unexpected error occurred when trying to decompress the response body (reason: '${options.error?.message}').`,
      options
    );

    this.buffer = options.buffer;
    this.encodings = options.encodings;
  }
}
