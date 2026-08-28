export interface LRUCacheOptions {
  /**
   * Maximum number of entries kept in the cache.
   */
  max: number;
  /**
   * Time to live in milliseconds. Entries never expire when omitted.
   */
  ttl?: number;
}

interface LRUCacheEntry<T> {
  value: T;
  expireAt: number;
}

/**
 * @description Least Recently Used cache with an optional time to live.
 * @see https://en.wikipedia.org/wiki/Page_replacement_algorithm
 */
export class LRUCache<K, T> {
  #entries = new Map<K, LRUCacheEntry<T>>();
  #max: number;
  #ttl: number;

  constructor(options: LRUCacheOptions) {
    const { max, ttl = Infinity } = options;

    if (!Number.isInteger(max) || max <= 0) {
      throw new TypeError("max must be a positive integer");
    }
    if (ttl <= 0) {
      throw new TypeError("ttl must be a positive number");
    }

    this.#max = max;
    this.#ttl = ttl;
  }

  get size(): number {
    return this.#entries.size;
  }

  has(key: K): boolean {
    const entry = this.#entries.get(key);
    if (entry === undefined) {
      return false;
    }

    if (entry.expireAt <= Date.now()) {
      this.#entries.delete(key);

      return false;
    }

    return true;
  }

  get(
    key: K
  ): T | undefined {
    const entry = this.#entries.get(key);
    if (entry === undefined) {
      return undefined;
    }

    this.#entries.delete(key);
    if (entry.expireAt <= Date.now()) {
      return undefined;
    }
    this.#entries.set(key, entry);

    return entry.value;
  }

  set(
    key: K,
    value: T
  ): this {
    this.#entries.delete(key);
    this.#entries.set(key, {
      value,
      expireAt: this.#ttl === Infinity ? Infinity : Date.now() + this.#ttl
    });

    for (const oldestKey of this.#entries.keys()) {
      if (this.#entries.size <= this.#max) {
        break;
      }
      this.#entries.delete(oldestKey);
    }

    return this;
  }

  delete(
    key: K
  ): boolean {
    return this.#entries.delete(key);
  }

  clear(): void {
    this.#entries.clear();
  }
}
