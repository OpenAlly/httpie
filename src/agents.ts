// Import Third-party Dependencies
import {
  Agent,
  ProxyAgent,
  MockAgent
} from "undici";
import { LRUCache } from "lru-cache";

// Import Internal Dependencies
import {
  type InlineCallbackAction
} from "./request.js";

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
 * These are agents specifically designed to work with MyUnisoft.
 */
export interface CustomHttpAgent {
  customPath: string;
  origin: string;
  agent: Agent | ProxyAgent | MockAgent;
  limit?: InlineCallbackAction;
}

export const agents: Set<CustomHttpAgent> = new Set();

/**
 * @description Detect if a given string URI is matching a given Agent custom path.
 *
 * @example
 * const URI = computeAgentPath("/windev/ws_monitoring", windev);
 * assert.strictEqual(URI, "https://ws-dev.myunisoft.fr/ws_monitoring");
 */
export function isAgentPathMatchingURI(
  uri: string,
  agent: CustomHttpAgent
): URL | null {
  // Note: we want to match both '/path/xxx...' and 'path/xxx...'
  const localCustomPath = uri.charAt(0) === "/" ? `/${agent.customPath}` : agent.customPath;

  return uri.startsWith(localCustomPath) ?
    new URL(uri.slice(localCustomPath.length), agent.origin) :
    null;
}

/**
 * @description Compute a given string URI to the local list of agents.
 */
export function computeURIOnAllAgents(uri: string): ComputedUrlAndAgent {
  for (const agent of agents) {
    const url = isAgentPathMatchingURI(uri, agent);

    if (url !== null) {
      return { url, agent: agent.agent, limit: agent.limit };
    }
  }

  return computeURIOnDetectedAgent(new URL(uri));
}

function computeURIOnDetectedAgent(
  url: URL
): ComputedUrlAndAgent {
  const agent = detectAgentFromURI(url);

  return {
    url, agent: agent?.agent ?? null, limit: agent?.limit
  };
}

/**
 * @description Seek correspondence with local agents through the URI hostname
 * @see https://nodejs.org/api/url.html#url_url_hostname
 *
 * @example
 * detectAgentFromURI("https://ws-dev.myunisoft.fr/ws_monitoring"); // windev agent
 * detectAgentFromURI("https://www.google.fr/"); // null
 */
export function detectAgentFromURI(uri: URL): CustomHttpAgent | null {
  const hostname = uri.hostname;

  for (const agent of agents) {
    if (new URL(agent.origin).hostname === hostname) {
      return agent;
    }
  }

  return null;
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
