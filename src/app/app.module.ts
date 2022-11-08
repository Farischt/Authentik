import { Module } from "@nestjs/common"

import { PrismaModule } from "../database/prisma.module"
import { UserModule } from "../user/user.module"
import { AuthModule } from "../auth/auth.module"
import { RedisModule } from "../cache/redis.module"
import { ConfigurationModule as ConfigModule } from "../config/config.module"
import { TokenModule } from "../token/token.module"

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    UserModule,
    PrismaModule,
    AuthModule,
    TokenModule,
  ],
})
export class AppModule {}
