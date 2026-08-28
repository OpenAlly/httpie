// Import Third-party Dependencies
import {
  type Interceptable,
  MockAgent,
  setGlobalDispatcher
} from "undici";

export const kMockUrl = "http://com";

export function createMockPool(
  url: string = kMockUrl
): Interceptable {
  const mockAgent = new MockAgent();
  setGlobalDispatcher(mockAgent);
  mockAgent.disableNetConnect();

  return mockAgent.get(url);
}
