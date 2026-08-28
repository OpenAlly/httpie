// Import Node.js Dependencies
import { describe, it, mock } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { LRUCache } from "../../src/utils/lruCache.ts";

describe("LRUCache", () => {
  it("should throw if max is not a positive integer", () => {
    assert.throws(() => new LRUCache({ max: 0 }), { name: "TypeError" });
    assert.throws(() => new LRUCache({ max: 1.5 }), { name: "TypeError" });
  });

  it("should throw if ttl is not a positive number", () => {
    assert.throws(() => new LRUCache({ max: 1, ttl: 0 }), { name: "TypeError" });
  });

  it("should store and retrieve a value", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);

    assert.strictEqual(cache.get("foo"), 1);
    assert.strictEqual(cache.has("foo"), true);
    assert.strictEqual(cache.size, 1);
  });

  it("should return undefined for an unknown key", () => {
    const cache = new LRUCache<string, number>({ max: 2 });

    assert.strictEqual(cache.get("foo"), undefined);
    assert.strictEqual(cache.has("foo"), false);
  });

  it("should not grow beyond max and evict the least recently used entry", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);
    cache.set("bar", 2);
    cache.set("baz", 3);

    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.has("foo"), false);
    assert.strictEqual(cache.get("bar"), 2);
    assert.strictEqual(cache.get("baz"), 3);
  });

  it("should keep an entry alive when it is read", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);
    cache.set("bar", 2);
    cache.get("foo");
    cache.set("baz", 3);

    assert.strictEqual(cache.get("foo"), 1);
    assert.strictEqual(cache.has("bar"), false);
  });

  it("should not update recency when using has", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);
    cache.set("bar", 2);
    cache.has("foo");
    cache.set("baz", 3);

    assert.strictEqual(cache.has("foo"), false);
  });

  it("should overwrite an existing key without growing", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);
    cache.set("foo", 2);

    assert.strictEqual(cache.size, 1);
    assert.strictEqual(cache.get("foo"), 2);
  });

  it("should expire entries once the ttl is reached", () => {
    mock.timers.enable({ apis: ["Date"] });

    try {
      const cache = new LRUCache<string, number>({ max: 2, ttl: 100 });
      cache.set("foo", 1);

      mock.timers.tick(50);
      assert.strictEqual(cache.get("foo"), 1);

      mock.timers.tick(100);
      assert.strictEqual(cache.has("foo"), false);
      assert.strictEqual(cache.get("foo"), undefined);
      assert.strictEqual(cache.size, 0);
    }
    finally {
      mock.timers.reset();
    }
  });

  it("should never expire entries when no ttl is provided", () => {
    mock.timers.enable({ apis: ["Date"] });

    try {
      const cache = new LRUCache<string, number>({ max: 2 });
      cache.set("foo", 1);

      mock.timers.tick(1_000_000);
      assert.strictEqual(cache.get("foo"), 1);
    }
    finally {
      mock.timers.reset();
    }
  });

  it("should delete a given key", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);

    assert.strictEqual(cache.delete("foo"), true);
    assert.strictEqual(cache.delete("foo"), false);
    assert.strictEqual(cache.size, 0);
  });

  it("should clear all entries", () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set("foo", 1);
    cache.set("bar", 2);
    cache.clear();

    assert.strictEqual(cache.size, 0);
  });
});
