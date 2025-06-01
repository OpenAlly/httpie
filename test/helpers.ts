// Import Third-party Dependencies
import * as undici from "undici";

// Import Internal Dependencies
import { CustomHttpAgent, agents } from "../src/agents";

const windev: CustomHttpAgent = {
  customPath: "windev",
  origin: "https://ws.dev.myunisoft.tech",
  agent: new undici.Agent({
    connections: 500
  })
};
agents.add(windev);

export { windev };
