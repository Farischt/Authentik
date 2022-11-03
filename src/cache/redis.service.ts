import { Injectable, Inject, CACHE_MANAGER } from "@nestjs/common"
import { Cache, CachingConfig } from "cache-manager"

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from the cache
   *
   * @param key The key to get
   * @returns The value
   */
  public async get<T>(key: string): Promise<T> {
    return await this.cacheManager.get(key)
  }

  /**
   * Set a value in the cache
   *
   * @param key The key to set
   * @param value The value to set
   * @param options The options to set
   */
  public async set<T>(
    key: string,
    value: T,
    options?: CachingConfig
  ): Promise<void> {
    await this.cacheManager.set(key, value, options)
  }

  /**
   * Delete a value from the cache
   *
   * @param key The key to delete
   */
  public async del(key: string): Promise<void> {
    await this.cacheManager.del(key)
  }
}
