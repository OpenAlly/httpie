export function toArrayBuffer(
  buffer: Buffer
) {
  const { byteOffset, byteLength } = buffer;

  return buffer.buffer.slice(
    byteOffset,
    byteOffset + byteLength
  );
}
