// Import Node.js Dependencies
import { promisify } from "node:util";
import * as zlib from "node:zlib";

// Import Third-party Dependencies
import {
  type Dispatcher,
  parseMIMEType
} from "undici";

// Import Internal Dependencies
import { getEncodingCharset } from "../utils/encoding.ts";
import {
  HttpieDecompressionError,
  HttpieFetchBodyError,
  HttpieParserError
} from "../errors/index.ts";
import { type ModeOfHttpieResponseHandler } from "../types.ts";

const kAsyncGunzip = promisify(zlib.gunzip);
const kAsyncInflate = promisify(zlib.inflate);

const kDecompress = {
  gzip: kAsyncGunzip,
  "x-gzip": kAsyncGunzip,
  br: promisify(zlib.brotliDecompress),
  deflate: kAsyncInflate,
  compress: kAsyncInflate,
  "x-compress": kAsyncInflate,
  // Node.js >= 22.15.0
  ...(typeof zlib.zstdDecompress === "function" ?
    { zstd: promisify(zlib.zstdDecompress) } :
    {})
};

/**
 * Mirror the limit enforced by undici's decompress interceptor to avoid
 * unbounded decompression, see GHSA-gm62-xv2j-4w53 and CVE-2022-32206.
 */
export const kMaxContentEncodings = 5;

export type TypeOfDecompression = keyof typeof kDecompress;

export function getResponseData(
  response: Dispatcher.ResponseData,
  mode: "decompress" | "raw"
): Promise<Buffer>;
export function getResponseData<T>(
  response: Dispatcher.ResponseData,
  mode?: "parse"
): Promise<T>;
export function getResponseData<T>(
  response: Dispatcher.ResponseData,
  mode: ModeOfHttpieResponseHandler
): Promise<T | Buffer>;
export function getResponseData<T>(
  response: Dispatcher.ResponseData,
  mode: ModeOfHttpieResponseHandler = "parse"
) {
  if (mode === "raw") {
    return readBody(response);
  }

  if (mode === "decompress") {
    return decompressBody(response);
  }

  return parseBody<T>(response);
}

async function readBody(
  response: Dispatcher.ResponseData
): Promise<Buffer> {
  try {
    return Buffer.from(await response.body.arrayBuffer());
  }
  catch (error: any) {
    throw new HttpieFetchBodyError({
      message: "ResponseFetchError",
      error,
      response
    });
  }
}

async function decompressBody(
  response: Dispatcher.ResponseData
): Promise<Buffer> {
  const buffer = await readBody(response);
  const encodings = parseContentEncoding(
    response.headers["content-encoding"]
  );

  if (encodings.length === 0) {
    return buffer;
  }

  if (encodings.length > kMaxContentEncodings) {
    throw new HttpieDecompressionError({
      message: "TooManyContentEncodings",
      buffer,
      encodings,
      response
    });
  }

  let decompressedBuffer = buffer;
  for (let id = encodings.length - 1; id >= 0; id--) {
    const encoding = encodings[id] as TypeOfDecompression;
    const strategy = kDecompress[encoding];

    if (!strategy) {
      throw new HttpieDecompressionError(
        {
          message: "DecompressionNotSupported",
          buffer,
          encodings,
          response
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
        response
      });
    }
  }

  return decompressedBuffer;
}

/**
 * @description Parse the response body based on the 'Content-Type' header.
 * A body with a content type equal to 'application/json' is automatically parsed with JSON.parse().
 */
async function parseBody<T>(
  response: Dispatcher.ResponseData
): Promise<T | Buffer | string> {
  const buffer = await decompressBody(response);
  const contentType = response.headers["content-type"] as string;

  if (!contentType) {
    return buffer;
  }

  // Note: Even in case of an error we want to be able to recover the body that caused the JSON parsing error.
  let text: string | null = null;
  try {
    const mime = parseMIMEType(contentType);
    if (mime === "failure") {
      throw new Error("invalid media type");
    }

    if (mime.essence === "application/json") {
      text = bufferToString(buffer, mime.parameters.get("charset"));

      return JSON.parse(text);
    }

    if (mime.essence.startsWith("text/")) {
      return bufferToString(buffer, mime.parameters.get("charset"));
    }
  }
  catch (error: any) {
    throw new HttpieParserError({
      message: "ResponseParsingError",
      contentType,
      text,
      buffer,
      error,
      response
    });
  }

  return buffer;
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding#syntax
 */
function parseContentEncoding(
  header: string | string[] | undefined
): string[] {
  if (!header) {
    return [];
  }

  return (Array.isArray(header) ? header : [header])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function bufferToString(
  buffer: Buffer,
  charset: string | undefined
): string {
  return buffer.toString(
    getEncodingCharset(charset)
  );
}
