
<p align="center"><h1 align="center">
  Httpie
</h1>

<p align="center">
  A modern and light Node.js http client 🐢🚀.
</p>

<p align="center">
    <a href="https://github.com/OpenAlly/httpie">
      <img src="https://img.shields.io/github/package-json/v/OpenAlly/httpie?style=flat-square" alt="npm version">
    </a>
    <a href="https://github.com/OpenAlly/httpie">
      <img src="https://img.shields.io/github/license/OpenAlly/httpie?style=flat-square" alt="license">
    </a>
    <a href="https://api.securityscorecards.dev/projects/github.com/OpenAlly/httpie">
      <img src="https://api.securityscorecards.dev/projects/github.com/OpenAlly/httpie/badge" alt="ossf scorecard">
    </a>
    <a href="https://github.com/OpenAlly/httpie/actions?query=workflow%3A%22Node.js+CI%22">
      <img src="https://img.shields.io/github/actions/workflow/status/OpenAlly/httpie/node.js.yml" alt="github ci workflow">
    </a>
    <a href="https://github.com/OpenAlly/httpie">
      <img src="https://img.shields.io/github/languages/code-size/OpenAlly/httpie?style=flat-square" alt="size">
    </a>
</p>

## 📢 About

Httpie is a Node.js HTTP client built on [Undici](https://github.com/nodejs/undici). Its request API follows the small, function-based style of lukeed's [httpie](https://github.com/lukeed/httpie), with response parsing, agent selection, rate limiting, and `Result`-based error handling added around it.

## 🔬 Features

- Parses JSON and text responses from their `content-type`; other response bodies remain buffers.
- Decompresses encoded responses before parsing them.
- Provides `get`, `post`, `put`, `patch`, and `del` aliases alongside the general `request` function.
- Provides `safeRequest` and safe HTTP verb aliases that return a [Result](https://github.com/OpenAlly/npm-packages/tree/main/src/result).
- Selects an Undici dispatcher from a registered origin or path, with cached URI resolution.
- Accepts a rate-limiter callback through the `limit` option or an agent registration.

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) version 22 or higher

## 🚀 Getting Started

Install the package with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com):

```bash
npm install @openally/httpie
# or
yarn add @openally/httpie
```

## 📚 Usage example

```ts
import {
  get,
  post,
  isHTTPError
} from "@openally/httpie";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

try {
  const { data: posts } = await get<Post[]>(
    "https://jsonplaceholder.typicode.com/posts"
  );
  console.log(posts);

  const response = await post<Post>("https://jsonplaceholder.typicode.com/posts", {
    body: {
      title: "foo",
      body: "bar",
      userId: 1
    }
  });

  console.log(response.statusCode, response.data);
}
catch (error: unknown) {
  if (isHTTPError(error)) {
    console.error(error.statusCode, error.data);
  }
  else {
    throw error;
  }
}
```

The `safe` methods return a `Result` instead of throwing:

```ts
import { safePost } from "@openally/httpie";

const result = await safePost("https://jsonplaceholder.typicode.com/posts", {
  body: {
    title: "foo",
    body: "bar",
    userId: 1
  }
});

result.match(
  (response) => console.log(response.data),
  (error) => console.error(error.message)
);
```

> [!TIP]
> More examples available in the root folder **examples**.

## 📜 API

- [Requests, options, response modes, and safe methods](./docs/request.md)
- [Streams and pipelines](./docs/stream.md)
- [Agent registry and URI resolution](./docs/agents.md)

Httpie also re-exports selected Undici APIs. Their behavior follows the [Undici documentation](https://undici.nodejs.org).

## Error handling

Read [Error handling](./docs/errors.md) for thrown errors, safe results, and the `isHttpieError` and `isHTTPError` guards.

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/OpenAlly/httpie/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/OpenAlly/httpie/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/OpenAlly/httpie/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/OpenAlly/httpie/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/OpenAlly/httpie/commits?author=PierreDemailly" title="Code">💻</a> <a href="https://github.com/OpenAlly/httpie/commits?author=PierreDemailly" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sofiand.github.io/portfolio-client/"><img src="https://avatars.githubusercontent.com/u/39944043?v=4?s=100" width="100px;" alt="Yefis"/><br /><sub><b>Yefis</b></sub></a><br /><a href="https://github.com/OpenAlly/httpie/commits?author=SofianD" title="Code">💻</a> <a href="https://github.com/OpenAlly/httpie/issues?q=author%3ASofianD" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
