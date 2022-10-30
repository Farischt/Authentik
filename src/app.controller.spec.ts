import { Test, TestingModule } from "@nestjs/testing"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { PrismaService } from "./database/prisma.service"
import { UserModule } from "./user/user.module"

describe("AppController", () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
      controllers: [AppController],
      providers: [AppService, PrismaService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe("Hello World!")
    })
  })
})
