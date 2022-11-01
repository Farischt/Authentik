import { NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { Role } from "@prisma/client"
import { PrismaService } from "../../database/prisma.service"
import { UserService } from "../service/user.service"
import { UserController } from "./user.controller"

const DEFAULT_USER = {
  id: 1,
  email: "test@test.com",
  firstName: "Test",
  lastName: "User",
  password: "test",
  role: "USER" as Role,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: null,
}

const DEFAULT_RETURNED_USER = { ...DEFAULT_USER, password: null }
const INVALID_ID = "0"

describe("UserController", () => {
  let controller: UserController
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService],
    }).compile()

    controller = module.get<UserController>(UserController)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("getUser", () => {
    it("should throw not found exception", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null)
      await expect(controller.get(parseInt(INVALID_ID))).rejects.toThrowError(
        NotFoundException
      )
    })

    it("should return a user", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(DEFAULT_USER)
      const user = await controller.get(DEFAULT_USER.id)
      expect(user).toBeDefined()
      expect(user).toEqual(DEFAULT_RETURNED_USER)
    })
  })
})
