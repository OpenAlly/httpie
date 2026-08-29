# Requests

`request()` sends an HTTP or WebDAV request through Undici, reads the response body, and returns the response metadata with the decoded data. The `get`, `post`, `put`, `patch`, and `del` functions bind the method argument for common requests.

```ts
import { get } from "@openally/httpie";

interface User {
  id: number;
  name: string;
}

const { data, statusCode } = await get<User>(
  "https://api.example.com/users/42"
);

console.log(statusCode, data.name);
```

## `request()`

```ts
request<T>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options?: RequestOptions
): Promise<RequestResponse<T>>
```

`method` accepts the standard HTTP methods and the following WebDAV methods: `MKCOL`, `COPY`, `MOVE`, `LOCK`, `UNLOCK`, `PROPFIND`, and `PROPPATCH`.

`uri` may be an absolute URL, a WHATWG `URL`, or a path handled by a registered [agent](./agents.md). A relative path without a matching agent cannot be resolved and throws a URL parsing error.

The generic `T` describes the expected `data` value to TypeScript. It does not validate the response at runtime. Runtime decoding is controlled by the response `content-type` and the selected [response mode](#response-modes).

```ts
interface RequestResponse<T> {
  data: T;
  headers: IncomingHttpHeaders;
  statusMessage: string;
  statusCode: number;
}
```

## Request options

```ts
interface RequestOptions {
  headers?: IncomingHttpHeaders;
  querystring?: string | URLSearchParams;
  body?: any;
  authorization?: string;
  blocking?: boolean;
  agent?: Agent | ProxyAgent | MockAgent;
  limit?: InlineCallbackAction;
  mode?: "parse" | "decompress" | "raw";
  throwOnHttpError?: boolean;
}
```

| Option | Default | Behavior |
|---|---|---|
| `headers` | `{ "user-agent": "httpie" }` | Adds request headers. Header names are handled case-insensitively, so a supplied `User-Agent` replaces the default. |
| `querystring` | none | Sets query parameters from a string or `URLSearchParams`. Supplied values replace matching parameters already present in the URL. |
| `body` | `undefined` | Sends a string, `Buffer`, `URLSearchParams`, JSON object, array, `null`, or async iterable body. See [request bodies](#request-bodies). |
| `authorization` | none | Builds an `Authorization` header. A value containing `:` becomes Basic credentials; other non-empty values become Bearer tokens. |
| `blocking` | Undici default | Passes Undici's `blocking` dispatch option. Use it for a response that may hold up further pipelined requests on the same connection. |
| `agent` | resolved agent or global dispatcher | Uses the supplied Undici `Agent`, `ProxyAgent`, or `MockAgent` for this request. It takes precedence over the registered agent for the URI. |
| `limit` | registered limit or none | Wraps the Undici request in an async limiter callback. It takes precedence over a limiter registered with an agent. |
| `mode` | `"parse"` | Controls response decompression and parsing. |
| `throwOnHttpError` | `true` | Throws an `HttpieOnHttpError` for status codes greater than or equal to `400`. |

The exported `DEFAULT_HEADER` value contains the default user agent:

```ts
const DEFAULT_HEADER: { "user-agent": string };
```

### Request bodies

Httpie prepares common body values before dispatch:

| Body value | Sent value | Header behavior |
|---|---|---|
| Object, array, or `null` | `JSON.stringify(body)` | Sets `content-type: application/json` unless one was supplied. |
| `URLSearchParams` | URL-encoded string | Sets `content-type: application/x-www-form-urlencoded` unless one was supplied. |
| `string` or `Buffer` | Original value | Leaves `content-type` unchanged. |
| Async iterable, including Node.js readable streams | Original value | Leaves `content-type` and `content-length` unchanged. |

For non-streaming bodies, Httpie calculates and replaces `content-length`. An explicitly supplied `content-type` is kept.

```ts
import { post } from "@openally/httpie";

const response = await post<{ id: number }>(
  "https://api.example.com/posts",
  {
    headers: {
      "x-request-id": "req-42"
    },
    authorization: "secret-token",
    body: {
      title: "A short title"
    }
  }
);
```

The request above sends `Authorization: Bearer secret-token`. Passing `"username:password"` would send a Base64-encoded Basic authorization value instead.

### Query parameters

```ts
import { get } from "@openally/httpie";

const { data } = await get(
  "https://api.example.com/search?limit=10",
  {
    querystring: new URLSearchParams({
      limit: "25",
      query: "http client"
    })
  }
);
```

The final URL contains `limit=25` and `query=http+client`.

### Rate limiting

`limit` is any async function that receives the pending request as a callback and returns its result. Packages such as `p-ratelimit` produce callbacks with this shape.

```ts
type InlineCallbackAction = <T>(
  callback: () => Promise<T>
) => Promise<T>;
```

```ts
import { pRateLimit } from "p-ratelimit";
import { get } from "@openally/httpie";

const limit = pRateLimit({
  interval: 1_000,
  rate: 10,
  concurrency: 2
});

const response = await get("https://api.example.com/items", { limit });
```

## Response modes

| Mode | Decompresses | Returned `data` |
|---|---|---|
| `"parse"` | Yes | JSON for `application/json`, a string for `text/*`, and a `Buffer` for other or missing content types. |
| `"decompress"` | Yes | A `Buffer`. The `content-type` is ignored. |
| `"raw"` | No | A `Buffer` containing the response bytes as received. |

```ts
import { get } from "@openally/httpie";

const { data } = await get<Buffer>(
  "https://api.example.com/archive.gz",
  { mode: "raw" }
);
```

The supported content encodings are `gzip`, `x-gzip`, `br`, `deflate`, `compress`, and `x-compress`. `zstd` is supported when the running Node.js version provides `zlib.zstdDecompress`. A response may contain at most five content encodings.

Parsing uses the media type without its parameters. `application/json; charset=utf-8` is parsed as JSON, and `text/plain; charset=utf-8` becomes a string. Other media types remain buffers.

## HTTP verb aliases

```ts
type RequestCallback = <T>(
  uri: string | URL,
  options?: RequestOptions
) => Promise<RequestResponse<T>>;

const get: RequestCallback;
const post: RequestCallback;
const put: RequestCallback;
const patch: RequestCallback;
const del: RequestCallback;
```

Use `request()` directly for `HEAD`, `OPTIONS`, `CONNECT`, `TRACE`, or a WebDAV method.

## Safe requests

`safeRequest()` catches request, response, and HTTP-status errors and returns a `Result` from `@openally/result`.

```ts
safeRequest<T, E>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options?: RequestOptions
): Promise<Result<RequestResponse<T>, RequestError<E>>>
```

Safe aliases are available for the same five common HTTP methods:

```ts
type SafeRequestCallback = <T, E>(
  uri: string | URL,
  options?: RequestOptions
) => Promise<Result<RequestResponse<T>, RequestError<E>>>;

const safeGet: SafeRequestCallback;
const safePost: SafeRequestCallback;
const safePut: SafeRequestCallback;
const safePatch: SafeRequestCallback;
const safeDel: SafeRequestCallback;
```

```ts
import {
  isHTTPError,
  safeGet
} from "@openally/httpie";

interface Post {
  id: number;
  title: string;
}

interface ApiError {
  message: string;
}

const result = await safeGet<Post[], ApiError>(
  "https://api.example.com/posts"
);

result.match(
  ({ data }) => console.log(data),
  (error) => {
    if (isHTTPError(error)) {
      console.error(error.statusCode, error.data);
    }
    else {
      console.error(error.message);
    }
  }
);
```

See [Error handling](./errors.md) for the error fields and type guards. For response bodies that should stay as streams, use [`stream()` or `pipeline()`](./stream.md).
