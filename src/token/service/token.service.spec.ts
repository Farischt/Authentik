import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "../../database/prisma.service"
import { TokenService } from "./token.service"

import { Role, User, SessionToken } from "@prisma/client"
import { CreateUserDto, SerializedUser } from "../../user/types"
import { SessionTokenWithoutUserPassword } from "../types"

const TOKEN_TTL_IN_SECONDS = 60 * 60
const TOKEN_TTL_IN_MS = TOKEN_TTL_IN_SECONDS * 1000 // 3600000

const CREATE_USER_DATA: CreateUserDto = {
  email: "test@gmail.com",
  password: "test",
  firstName: "test",
  lastName: "test",
}
const USER_DATA: User = {
  id: 1,
  ...CREATE_USER_DATA,
  isVerified: true,
  role: "USER" as Role,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const USER_DATA_WITHOUT_PASSWORD = new SerializedUser(USER_DATA)
const IP_ADDRESS = "127.0.0.1"

const NON_EXPIRED_TOKEN: SessionToken = {
  id: "dc9151cf-c0b6-408c-9c8c-03e2da196c56",
  userId: 1,
  ipAddr: IP_ADDRESS,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const EXPIRED_TOKEN: SessionToken = {
  id: "dc9151cf-c0b6-408c-9c8c-03e2da196c56",
  userId: 1,
  ipAddr: IP_ADDRESS,
  createdAt: new Date(Date.now() - TOKEN_TTL_IN_MS),
  updatedAt: new Date(Date.now() - TOKEN_TTL_IN_MS),
}

const SESSION_TOKEN_WITH_USER: SessionTokenWithoutUserPassword = {
  ...NON_EXPIRED_TOKEN,
  user: USER_DATA_WITHOUT_PASSWORD,
}

describe("TokenService", () => {
  let service: TokenService
  let prismaService: PrismaService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenService, PrismaService],
    }).compile()

    service = module.get<TokenService>(TokenService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("Token expiration", () => {
    it("should not be expired", async () => {
      const isValid = service.isTokenValid(NON_EXPIRED_TOKEN)
      expect(isValid).toBe(true)
    })

    it("should be expired", () => {
      const isValid = service.isTokenValid(EXPIRED_TOKEN)
      expect(isValid).toBe(false)
    })
  })

  it("should get a session token containing its user ", async () => {
    jest
      .spyOn(prismaService.sessionToken, "findUnique")
      .mockResolvedValue(SESSION_TOKEN_WITH_USER)
    const token = await service.getSessionTokenWithoutUserPassword({
      id: NON_EXPIRED_TOKEN.id,
    })
    expect(token).toEqual(SESSION_TOKEN_WITH_USER)
  })

  it("should get a session token without the user", async () => {
    jest
      .spyOn(prismaService.sessionToken, "findUnique")
      .mockResolvedValue(NON_EXPIRED_TOKEN)
    const token = await service.getSessionTokenWithoutUserPassword(
      {
        id: NON_EXPIRED_TOKEN.id,
      },
      false
    )
    expect(token).toEqual(NON_EXPIRED_TOKEN)
  })

  it("should create a session token", async () => {
    jest
      .spyOn(prismaService.sessionToken, "create")
      .mockResolvedValue(NON_EXPIRED_TOKEN)
    const token = await service.createSessionToken(USER_DATA.id, "127.0.0.1")
    expect(token).toEqual(NON_EXPIRED_TOKEN)
  })

  it("should get an account confirmation token", async () => {
    const dbCreate = jest
      .spyOn(prismaService.accountConfirmationToken, "findUnique")
      .mockResolvedValue(NON_EXPIRED_TOKEN)
    const token = await service.getAccountConfirmationToken({
      id: NON_EXPIRED_TOKEN.id,
    })
    expect(dbCreate).toHaveBeenCalledWith({
      where: { id: NON_EXPIRED_TOKEN.id },
    })
    expect(token).toEqual(NON_EXPIRED_TOKEN)
  })

  it("should create an account confirmation token", async () => {
    const dbCreate = jest
      .spyOn(prismaService.accountConfirmationToken, "create")
      .mockResolvedValue(NON_EXPIRED_TOKEN)
    const token = await service.createAccountConfirmationToken(USER_DATA.id)
    expect(dbCreate).toHaveBeenCalledWith({
      data: { user: { connect: { id: USER_DATA.id } } },
    })
    expect(token).toEqual(NON_EXPIRED_TOKEN)
  })
})
