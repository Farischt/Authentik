import { Module, CacheModule, Global } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as redisStore from "cache-manager-redis-store"
import type { RedisConfig } from "../config"
import { RedisService } from "./redis.service"

const RedisCacheModule = CacheModule.registerAsync({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisConfig = configService.get<RedisConfig>("REDIS")
    return {
      store: redisStore,
      isGlobal: true,
      host: redisConfig.HOST,
      port: redisConfig.PORT,
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
