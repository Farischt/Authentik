import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "../../database/prisma.service"
import { UserService } from "../service/user.service"
import { UserController } from "./user.controller"

describe("UserController", () => {
  let controller: UserController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService],
    }).compile()

    controller = module.get<UserController>(UserController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("getUser", () => {
    it("should return a user", async () => {
      const result = await controller.getUser()
      expect(result).toEqual({
        id: 1,
        email: "test@test.com",
        firstName: "Test",
        lastName: "Test",
        role: "USER",
      })
    })
  })
})
