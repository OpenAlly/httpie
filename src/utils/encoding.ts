// CONSTANTS
const kDefaultEncodingCharset = "utf-8";
const kCharsetConversionTable: Record<string, BufferEncoding> = {
  "ISO-8859-1": "latin1"
};

/**
 * @description Get a valid Node.js charset from the "content-type" http header.
 * @see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
 */
export function getEncodingCharset(
  charset = kDefaultEncodingCharset
): BufferEncoding {
  if (Buffer.isEncoding(charset)) {
    return charset;
  }

  return kCharsetConversionTable[charset] ?? kDefaultEncodingCharset;
}
