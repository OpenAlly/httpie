# Agents

The `agents` registry maps a service path or hostname to an Undici dispatcher. Register an agent once, then use either a short service path such as `/catalog/items` or the service's absolute URL in `request()`, its HTTP verb aliases, `stream()`, and `pipeline()`.

```ts
interface CustomHttpAgent {
  customPath: string;
  origin: string;
  agent: Agent | ProxyAgent | MockAgent;
  limit?: InlineCallbackAction;
}

const agents: Set<CustomHttpAgent>;
```

## Register an agent

```ts
import {
  Agent,
  agents,
  get,
  type CustomHttpAgent
} from "@openally/httpie";

const catalog: CustomHttpAgent = {
  customPath: "catalog",
  origin: "https://catalog.example.com",
  agent: new Agent({
    connections: 30
  })
};

agents.add(catalog);

const { data } = await get("/catalog/items");
```

The request path `/catalog/items` becomes `https://catalog.example.com/items` and uses `catalog.agent` as its Undici dispatcher.

`agents` is a standard JavaScript `Set`. Keep a reference to an entry if it may need to be removed later:

```ts
agents.delete(catalog);
```

## Matching rules

A string URI is resolved in this order:

1. Httpie checks each registered `customPath` in insertion order. Both `/catalog/items` and `catalog/items` match `customPath: "catalog"`.
2. If no path matches, Httpie parses the string as an absolute URL and looks for an agent whose `origin` has the same hostname.

A WHATWG `URL` is matched by hostname. Path aliases apply only to string URIs.

The first matching entry wins. Use distinct path prefixes when several agents are registered.

```ts
const internalApi: CustomHttpAgent = {
  customPath: "internal",
  origin: "https://api.example.com",
  agent: new Agent()
};

agents.add(internalApi);

await get("/internal/users");
await get("https://api.example.com/users");
```

Both requests use `internalApi.agent`.

## Per-request overrides

The `agent` option on a request takes precedence over the dispatcher selected from the registry:

```ts
import {
  ProxyAgent,
  get
} from "@openally/httpie";

const proxy = new ProxyAgent("http://proxy.example.com:8080");

const response = await get("/catalog/items", {
  agent: proxy
});
```

An agent entry may also provide a `limit` callback. A request-level `limit` overrides the registered one.

```ts
const catalog: CustomHttpAgent = {
  customPath: "catalog",
  origin: "https://catalog.example.com",
  agent: new Agent(),
  limit: async(callback) => callback()
};
```

See [Request options](./request.md#request-options) for the callback signature.

## `computeURI()`

`computeURI()` exposes the resolution used internally by requests and streams.

```ts
computeURI(
  uri: string | URL
): {
  url: URL;
  agent: Agent | ProxyAgent | MockAgent | null;
  limit?: InlineCallbackAction;
}
```

```ts
import { computeURI } from "@openally/httpie";

const resolved = computeURI("/catalog/items");

console.log(resolved.url.href);
// https://catalog.example.com/items
```

URI resolutions are cached by input string. The cache holds up to 100 entries for 120 minutes. Register agents before sending requests or calling `computeURI()`, because changing the `agents` set does not invalidate entries already in the cache.

The returned `URL` can be changed by the caller without modifying the cached URL.

## Undici dispatchers

Httpie re-exports the dispatcher classes used by the registry, including `Agent`, `ProxyAgent`, and `MockAgent`. It also re-exports `Client`, interceptors, global dispatcher helpers, and Undici's mocking utilities. Configuration and lifecycle behavior for those exports follows the [Undici documentation](https://undici.nodejs.org).
