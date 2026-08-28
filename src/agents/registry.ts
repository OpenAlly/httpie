// Import Third-party Dependencies
import {
  Agent,
  ProxyAgent,
  MockAgent
} from "undici";

// Import Internal Dependencies
import type { InlineCallbackAction } from "../types.js";

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
  const localCustomPath = uri.charAt(0) === "/"
    ? `/${agent.customPath}`
    : agent.customPath;

  return uri.startsWith(localCustomPath) ?
    new URL(uri.slice(localCustomPath.length), agent.origin) :
    null;
}

/**
 * @description Seek correspondence with local agents through the URI hostname
 * @see https://nodejs.org/api/url.html#url_url_hostname
 *
 * @example
 * detectAgentFromURI("https://ws-dev.myunisoft.fr/ws_monitoring"); // windev agent
 * detectAgentFromURI("https://www.google.fr/"); // null
 */
export function detectAgentFromURI(
  uri: URL
): CustomHttpAgent | null {
  const hostname = uri.hostname;

  for (const agent of agents) {
    if (new URL(agent.origin).hostname === hostname) {
      return agent;
    }
  }

  return null;
}
