
// Import Node.js Dependencies
import { promisify } from "node:util";
import { inflate, brotliDecompress, gunzip } from "node:zlib";

// Import Third-party Dependencies
import {
  Dispatcher,
  parseMIMEType,
  type MIMEType
} from "undici";

// Import Internal Dependencies
import { getEncodingCharset } from "../utils.js";
import {
  HttpieDecompressionError,
  HttpieFetchBodyError,
  HttpieParserError
} from "./HttpieHandlerError.js";

const kAsyncGunzip = promisify(gunzip);
const kDecompress = {
  gzip: kAsyncGunzip,
  "x-gzip": kAsyncGunzip,
  br: promisify(brotliDecompress),
  deflate: promisify(inflate)
};

export type TypeOfDecompression = keyof typeof kDecompress;
export type ModeOfHttpieResponseHandler = "decompress" | "parse" | "raw";

export class HttpieResponseHandler {
  response: Dispatcher.ResponseData;

  constructor(response: Dispatcher.ResponseData) {
    this.response = response;
  }

  getData(mode: "decompress" | "raw"): Promise<Buffer>;
  getData<T>(mode?: "parse"): Promise<T>;
  getData<T>(mode: ModeOfHttpieResponseHandler = "parse") {
    if (mode === "parse") {
      return this.parseUndiciResponse<T>();
    }

    if (mode === "decompress") {
      return this.getDecompressedBuffer();
    }

    return this.getBuffer();
  }

  private async getBuffer(): Promise<Buffer> {
    try {
      return Buffer.from(await this.response.body.arrayBuffer());
    }
    catch (error: any) {
      throw new HttpieFetchBodyError({
        message: "ResponseFetchError",
        error,
        response: this.response
      });
    }
  }

  private async getDecompressedBuffer(): Promise<Buffer> {
    const buffer = await this.getBuffer();
    const encodingHeader = this.response.headers["content-encoding"];

    if (!encodingHeader) {
      return buffer;
    }

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding#syntax
    const encodings = Array.isArray(encodingHeader) ?
      encodingHeader.reverse() :
      encodingHeader.split(",").reverse();

    let decompressedBuffer: Buffer = Buffer.from(buffer);
    for (const rawEncoding of encodings) {
      const encoding = rawEncoding.trim() as TypeOfDecompression;
      const strategy = kDecompress[encoding];

      if (!strategy) {
        throw new HttpieDecompressionError(
          {
            message: "DecompressionNotSupported",
            buffer,
            encodings,
            response: this.response
          },
          encoding
        );
      }

      try {
        decompressedBuffer = await strategy(decompressedBuffer);
      }
      catch (error: any) {
        throw new HttpieDecompressionError({
          message: "UnexpectedDecompressionError",
          buffer,
          encodings,
          error,
          response: this.response
        });
      }
    }

    return decompressedBuffer;
  }

  /**
   * @description Parse Undici a buffer based on 'Content-Type' header.
   * If the response as a content type equal to 'application/json' we automatically parse it with JSON.parse().
   */
  private async parseUndiciResponse<T>(): Promise<T | Buffer | string> {
    const buffer = await this.getDecompressedBuffer();
    const contentTypeHeader = this.response.headers["content-type"] as string;

    if (!contentTypeHeader) {
      return buffer;
    }

    let bodyAsString = "";
    try {
      const mime = parseMIMETypeWithError(contentTypeHeader);

      bodyAsString = buffer.toString(
        getEncodingCharset(mime.parameters.get("charset"))
      );

      if (mime.essence === "application/json") {
        return JSON.parse(bodyAsString);
      }

      if (mime.essence.startsWith("text/")) {
        return bodyAsString;
      }
    }
    catch (error: any) {
      // Note: Even in case of an error we want to be able to recover the body that caused the JSON parsing error.
      throw new HttpieParserError({
        message: "ResponseParsingError",
        contentType: contentTypeHeader,
        text: bodyAsString || null,
        buffer,
        error,
        response: this.response
      });
    }

    return buffer;
  }
}

function parseMIMETypeWithError(
  mimeType: string
): MIMEType {
  const mime = parseMIMEType(mimeType);
  if (mime === "failure") {
    throw new Error("invalid media type");
  }

  return mime;
}
