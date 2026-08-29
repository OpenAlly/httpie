# Streams and pipelines

`stream()` writes an Undici response body into a writable stream created by the caller. `pipeline()` returns a duplex stream that accepts a request body and emits the response body. Both functions use the same headers, body preparation, query parameters, and [agent resolution](./agents.md) as `request()`.

These APIs expose raw streams. They do not parse response bodies or turn HTTP status codes into `HttpieOnHttpError` instances.

```ts
type StreamOptions<TOpaque = null> = Omit<RequestOptions, "limit"> & {
  opaque?: TOpaque;
};
```

The `limit` option is not available for streams. Options used only by the buffered response handler, including `mode` and `throwOnHttpError`, do not change streaming behavior.

## `stream()`

```ts
stream<TOpaque = null>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options?: StreamOptions<TOpaque>
): WritableStreamCallback<TOpaque>

type WritableStreamCallback<TOpaque = null> = (
  factory: Dispatcher.StreamFactory<TOpaque>
) => Promise<Dispatcher.StreamData<TOpaque>>;
```

`stream()` prepares the request and returns a callback. Invoke that callback with an Undici stream factory that receives the response metadata and returns a Node.js `Writable`.

```ts
import { createWriteStream } from "node:fs";
import {
  Agent,
  interceptors,
  stream
} from "@openally/httpie";

const agent = new Agent()
  .compose(interceptors.redirect({ maxRedirections: 2 }));

const download = stream(
  "GET",
  "https://github.com/NodeSecure/vulnera/archive/main.tar.gz",
  {
    agent,
    headers: {
      "user-agent": "httpie"
    }
  }
);

await download(({ headers, statusCode }) => {
  console.log(statusCode, headers["content-type"]);

  return createWriteStream("./vulnera-main.tar.gz");
});
```

Inspect `statusCode` in the factory when non-success responses need separate handling. The response body is still written to the returned stream.

## `pipeline()`

```ts
pipeline<TOpaque = null>(
  method: HttpMethod | WebDavMethod,
  uri: string | URL,
  options?: StreamOptions<TOpaque>
): Duplex
```

The writable side becomes the request body. The readable side emits the response body.

```ts
import { createReadStream } from "node:fs";
import { pipeline as nodePipeline } from "node:stream/promises";
import { pipeline } from "@openally/httpie";

await nodePipeline(
  createReadStream("./payload.json"),
  pipeline(
    "POST",
    "https://jsonplaceholder.typicode.com/posts",
    {
      headers: {
        "content-type": "application/json"
      }
    }
  ),
  process.stdout
);
```

When a file or other stream supplies the body, Httpie does not calculate `content-length`. Add it to `headers` when the server requires a fixed length.

## Options and dispatchers

The following `RequestOptions` affect `stream()` and `pipeline()`:

- `headers`, `querystring`, `body`, and `authorization`
- `blocking`
- `agent`, including an agent selected from the registry

For `pipeline()`, data written to the duplex stream is normally the request body, so avoid supplying both a streamed input and `options.body`.

`StreamOptions` currently includes `opaque` for Undici type compatibility, but Httpie does not forward that value to the dispatcher.

See [Requests](./request.md) for buffered and parsed responses.
