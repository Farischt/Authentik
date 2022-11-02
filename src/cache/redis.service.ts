import { Injectable, Inject, CACHE_MANAGER } from "@nestjs/common"
import { Cache, CachingConfig } from "cache-manager"

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T> {
    return await this.cacheManager.get(key)
  }

  async set<T>(key: string, value: T, options?: CachingConfig): Promise<void> {
    await this.cacheManager.set(key, value, options)
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key)
  }
}
