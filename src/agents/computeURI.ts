// Import Third-party Dependencies
import {
  Agent,
  ProxyAgent,
  MockAgent
} from "undici";
import { LRUCache } from "lru-cache";

// Import Internal Dependencies
import type { InlineCallbackAction } from "../types.ts";
import {
  agents,
  detectAgentFromURI,
  isAgentPathMatchingURI
} from "./registry.ts";

/**
 * @see https://en.wikipedia.org/wiki/Page_replacement_algorithm
 */
export const URI_CACHE = new LRUCache<string, ComputedUrlAndAgent>({
  max: 100,
  ttl: 1_000 * 60 * 120
});

export interface ComputedUrlAndAgent {
  url: URL;
  agent: Agent | ProxyAgent | MockAgent | null;
  limit?: InlineCallbackAction;
}

/**
 * @description Compute a given string URI to the local list of agents.
 */
export function computeURIOnAllAgents(uri: string): ComputedUrlAndAgent {
  for (const agent of agents) {
    const url = isAgentPathMatchingURI(uri, agent);

    if (url !== null) {
      return {
        url,
        agent: agent.agent,
        limit: agent.limit
      };
    }
  }

  return computeURIOnDetectedAgent(new URL(uri));
}

function computeURIOnDetectedAgent(
  url: URL
): ComputedUrlAndAgent {
  const agent = detectAgentFromURI(url);

  return {
    url,
    agent: agent?.agent ?? null,
    limit: agent?.limit
  };
}

/**
 * Compute a given URI (format string or WHATWG URL) and return a fully build URL and paired agent.
 */
export function computeURI(
  uri: string | URL
): ComputedUrlAndAgent {
  const uriStr = uri.toString();

  const cached = URI_CACHE.get(uriStr);
  if (cached) {
    return {
      ...cached,
      url: new URL(cached.url)
    };
  }

  const computed = typeof uri === "string" ?
    computeURIOnAllAgents(uri) :
    computeURIOnDetectedAgent(uri);
  URI_CACHE.set(
    uriStr,
    {
      ...computed,
      url: new URL(computed.url)
    }
  );

  return computed;
}
