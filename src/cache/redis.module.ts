import { Module, CacheModule, Global } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as redisStore from "cache-manager-redis-store"

import { RedisConfig, Configuration } from "../config"
import { RedisService } from "./redis.service"

const RedisCacheModule = CacheModule.registerAsync({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisConfig = configService.get<RedisConfig>(Configuration.REDIS)
    return {
      store: redisStore,
      isGlobal: true,
      host: redisConfig?.HOST ?? "localhost",
      port: redisConfig?.PORT ?? 6379,
    }
  },
  isGlobal: true,
})

@Global()
@Module({
  imports: [RedisCacheModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
