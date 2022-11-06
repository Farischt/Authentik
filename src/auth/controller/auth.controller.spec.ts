import { Test, TestingModule } from "@nestjs/testing"
import { RedisModule } from "../../cache/redis.module"
import { AuthController } from "./auth.controller"
import { PrismaModule } from "../../database/prisma.module"
import { AuthService } from "../../auth/service/auth.service"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"
import { UserService } from "../../user/service/user.service"

describe("AuthController", () => {
  let controller: AuthController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, RedisModule, PrismaModule],
      providers: [AuthService, UserService],
      controllers: [AuthController],
    }).compile()

    controller = app.get<AuthController>(AuthController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  // describe("Register", () => {
  //   it("should ")
  // })
})
