import { Test, TestingModule } from "@nestjs/testing"

import { RedisModule } from "../../cache/redis.module"
import { AuthService } from "./auth.service"
import { PrismaModule } from "../../database/prisma.module"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"
import { UserService } from "../../user/service/user.service"
import { AuthController } from "../controller/auth.controller"

describe("AuthService", () => {
  let service: AuthService

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ConfigModule, RedisModule],
      providers: [AuthService, UserService],
      controllers: [AuthController],
      exports: [AuthService],
    }).compile()

    service = app.get<AuthService>(AuthService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})
