# Error handling

Httpie can fail while dispatching a request, reading or decoding its body, or handling an HTTP error status. Use `isHttpieError()` to identify errors created by this package and `isHTTPError()` when the server returned a status code greater than or equal to `400`.

```ts
import {
  get,
  isHTTPError,
  isHttpieError
} from "@openally/httpie";

try {
  await get("https://api.example.com/private");
}
catch (error: unknown) {
  if (isHTTPError(error)) {
    console.error(error.statusCode, error.statusMessage);
    console.error(error.data);
  }
  else if (isHttpieError(error)) {
    console.error(error.statusCode, error.message);
  }
  else {
    throw error;
  }
}
```

Httpie errors share these response fields:

```ts
interface HttpieError extends Error {
  headers: IncomingHttpHeaders;
  statusCode: number;
}
```

The type guards use a global symbol brand, so they continue to work across JavaScript realms and duplicated installations where `instanceof` may fail.

## `isHttpieError()`

```ts
isHttpieError(error: unknown): error is HttpieError
```

Returns `true` for HTTP status errors and for failures raised while reading, decompressing, or parsing a response body. Connection and URL errors thrown directly by Node.js or Undici return `false`.

## `isHTTPError()`

```ts
isHTTPError<
  T extends RequestResponse<any> = RequestResponse<any>
>(error: unknown): error is HttpieOnHttpError<T>
```

Returns `true` only for `HttpieOnHttpError`. Use it when code needs access to the parsed error response through `error.data`.

## HTTP status errors

Requests use `throwOnHttpError: true` by default. A response with a status code greater than or equal to `400` throws `HttpieOnHttpError` after the response body has been processed according to the selected [response mode](./request.md#response-modes).

```ts
class HttpieOnHttpError<
  T extends RequestResponse<any>
> extends Error {
  name: "HttpieOnHttpError";
  statusCode: number;
  statusMessage: string;
  headers: IncomingHttpHeaders;
  data: T["data"];
}
```

Set `throwOnHttpError` to `false` when the caller should inspect the response directly:

```ts
import { get } from "@openally/httpie";

const response = await get("https://api.example.com/missing", {
  throwOnHttpError: false
});

if (response.statusCode === 404) {
  console.log("The resource does not exist");
}
```

## Response body errors

Errors raised while processing a response body include `statusCode`, `headers`, `message`, and the original failure as `reason: Error | null`.

| Failure | `name` | Additional fields |
|---|---|---|
| The response body could not be read | `ResponseFetchError` | none |
| The content encoding is unsupported | `DecompressionNotSupported` | `buffer`, `encodings` |
| More than five content encodings were supplied | `TooManyContentEncodings` | `buffer`, `encodings` |
| Decompression failed | `UnexpectedDecompressionError` | `buffer`, `encodings` |
| The media type or response data could not be parsed | `ResponseParsingError` | `buffer`, `contentType`, `text` |

`buffer` contains the response bytes available when processing failed. For parser errors, `text` contains the decoded text when parsing reached that stage; otherwise it is `null`.

```ts
import {
  get,
  isHttpieError
} from "@openally/httpie";

try {
  await get("https://api.example.com/broken-json");
}
catch (error: unknown) {
  if (
    isHttpieError(error) &&
    error.name === "ResponseParsingError" &&
    "reason" in error &&
    "text" in error
  ) {
    console.error(error.reason);
    console.error(error.text);
  }
}
```

## Safe methods

`safeRequest`, `safeGet`, `safePost`, `safePut`, `safePatch`, and `safeDel` return thrown failures in the `Err` branch of a `Result`. Httpie errors still work with the guards above; connection errors from Node.js or Undici remain unbranded errors.

```ts
import {
  isHTTPError,
  safeGet
} from "@openally/httpie";

interface ApiError {
  message: string;
}

const result = await safeGet<unknown, ApiError>(
  "https://api.example.com/private"
);

if (result.err) {
  const error = result.val;

  if (isHTTPError(error)) {
    console.error(error.statusCode, error.data);
  }
  else {
    console.error(error.message);
  }
}
```

See [Safe requests](./request.md#safe-requests) for their signatures and the full `Result` example.
