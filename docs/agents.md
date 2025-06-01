# Agents

Agents are custom constructs that are used to describe internal and external services.

```js
import { agents } from "@openally/httpie";

console.log(agents); // <- push a new agent in this Array
```

Those custom `agents` are described by the following TypeScript interface:
```ts
export interface CustomHttpAgent {
  customPath: string;
  origin: string;
  agent: Agent;
}
```

Example with a test custom agent:
```ts
export const test: CustomHttpAgent = {
  customPath: "test",
  agent: new Agent({
    connections: 30
  }),
  origin: "https://test.domain.fr"
};

// Note: push it to the package agents list
agents.add(test);
```

The **agent** property is an Undici Agent.
