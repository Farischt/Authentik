import { Test, TestingModule } from "@nestjs/testing"

import { UserService } from "./user.service"
import { UserController } from "../controller/user.controller"
import { PrismaService } from "../../database/prisma.service"
import { User } from "@prisma/client"
import { CreateUserDto } from "../types"

describe("UserService", () => {
  let service: UserService
  let prismaService: PrismaService

  const userMock: User = {
    id: 1,
    email: "zedz",
    password: "123456",
    firstName: "Zed",
    lastName: "Zed",
    isVerified: true,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService],
    }).compile()

    service = module.get<UserService>(UserService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  it("should get a user", async () => {
    const findUnique = jest
      .spyOn(prismaService.user, "findUnique")
      .mockResolvedValue(userMock)

    const user = await service.getUser({ id: 1 })
    expect(user).toEqual(userMock)
    expect(findUnique).toBeCalledWith({ where: { id: 1 } })
  })

  it("should create a user", async () => {
    const createUserInput: CreateUserDto = {
      email: "zedz",
      password: "123456",
      firstName: "Zed",
      lastName: "Zed",
    }
    const create = jest
      .spyOn(prismaService.user, "create")
      .mockResolvedValue(userMock)
    const user = await service.createUser(createUserInput)
    expect(user).toEqual(userMock)
    expect(create).toBeCalledWith({ data: createUserInput })
  })

  it("should create a user with a defined role", async () => {
    const createUserInput: Omit<CreateUserDto, "role"> = {
      email: "zedz",
      password: "123456",
      firstName: "Zed",
      lastName: "Zed",
    }
    const createUser = jest
      .spyOn(service, "createUser")
      .mockResolvedValue(userMock)
    const user = await service.createUserWithRole(createUserInput, "ADMIN")
    expect(user).toEqual(userMock)
    expect(createUser).toBeCalledWith({ ...createUserInput, role: "ADMIN" })
  })

  it("should update a user", async () => {
    const update = jest
      .spyOn(prismaService.user, "update")
      .mockResolvedValue({ ...userMock, email: "zedz" })
    const user = await service.updateUser(
      { id: userMock.id },
      { email: "zedz" }
    )
    expect(user).toEqual({ ...userMock, email: "zedz" })
    expect(update).toBeCalledWith({
      where: { id: userMock.id },
      data: { email: "zedz" },
    })
  })

  it("should delete a user", async () => {
    const deleteFn = jest
      .spyOn(prismaService.user, "delete")
      .mockResolvedValue(userMock)
    const user = await service.deleteUser({ id: userMock.id })
    expect(user).toEqual(userMock)
    expect(deleteFn).toBeCalledWith({ where: { id: userMock.id } })
  })
})
