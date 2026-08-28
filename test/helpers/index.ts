// Import Third-party Dependencies
import * as undici from "undici";

// Import Internal Dependencies
import { type CustomHttpAgent, agents } from "../../src/agents/index.ts";

const windev: CustomHttpAgent = {
  customPath: "windev",
  origin: "https://ws.dev.myunisoft.tech",
  agent: new undici.Agent({
    connections: 500
  })
};
agents.add(windev);

export { windev };
