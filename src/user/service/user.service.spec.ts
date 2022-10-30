import { Test, TestingModule } from "@nestjs/testing"
import { UserService } from "./user.service"
import { UserController } from "../controller/user.controller"
import { PrismaService } from "../../database/prisma.service"

describe("UserService", () => {
  let service: UserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})
