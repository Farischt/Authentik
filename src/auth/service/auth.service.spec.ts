import { Test, TestingModule } from "@nestjs/testing"
import { RedisModule } from "../../cache/redis.module"
import { AuthService } from "./auth.service"
import { PrismaModule } from "../../database/prisma.module"
import { UserModule } from "../../user/user.module"
import { AuthModule } from "../../auth/auth.module"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"

describe("AuthService", () => {
  let service: AuthService

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        RedisModule,
        UserModule,
        PrismaModule,
        AuthModule,
      ],
    }).compile()

    service = app.get<AuthService>(AuthService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})
