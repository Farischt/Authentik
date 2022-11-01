import { Test, TestingModule } from "@nestjs/testing"
import { RedisModule } from "../../cache/redis.module"
import { AuthController } from "./auth.controller"
import { PrismaModule } from "../../database/prisma.module"
import { UserModule } from "../../user/user.module"
import { AuthModule } from "../../auth/auth.module"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"

describe("AuthController", () => {
  let controller: AuthController

  beforeEach(async () => {
    // TODO: use valid dependencies
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        RedisModule,
        UserModule,
        PrismaModule,
        AuthModule,
      ],
    }).compile()

    controller = app.get<AuthController>(AuthController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })
})
