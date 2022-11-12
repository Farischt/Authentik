import { Test, TestingModule } from "@nestjs/testing"
import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Request } from "express"

import { AuthGuard } from "./auth.guard"
import { RedisModule } from "../../cache/redis.module"
import { AuthService } from "../service/auth.service"
import { PrismaModule } from "../../database/prisma.module"
import { PrismaService } from "../../database/prisma.service"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"
import { UserService } from "../../user/service/user.service"
import { TokenService } from "../../token/service/token.service"
import { AuthError } from "../types"
import { TokenWithoutUserPassword, Token } from "../../token/types"

const TOKEN: Token = {
  id: "token",
  userId: 1,
  ipAddr: "ip",
  createdAt: new Date(),
  updatedAt: new Date(),
  //   user: {
  //     id: 1,
  //     email: "email",
  //     firstName: "test",
  //     lastName: "test",
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     password: null,
  //     role: "USER",
  //     isVerified: true,
  //   },
}

describe("AuthGuard", () => {
  let tokenService: TokenService
  let prismaService: PrismaService
  let guard: AuthGuard

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, PrismaModule, ConfigModule],
      providers: [AuthService, UserService, TokenService],
    }).compile()

    tokenService = app.get<TokenService>(TokenService)
    prismaService = app.get<PrismaService>(PrismaService)
    guard = new AuthGuard(tokenService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(tokenService).toBeDefined()
    expect(guard).toBeDefined()
  })

  describe("HasUserValidSessionToken", () => {
    it("should throw an error if there is no session cookie", async () => {
      const req = {
        cookies: {},
      } as unknown as Request
      try {
        await guard.hasUserValidSessionToken(req)
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect(error.name).toEqual("ForbiddenException")
        expect(error.message).toEqual(AuthError.NoSessionCookie)
      }
    })

    it("should throw an error if the session token is not found", async () => {
      const req = {
        cookies: {
          "session-token": TOKEN.id,
        },
      } as unknown as Request
      const getSessionTokenWithoutUserPassword = jest
        .spyOn(tokenService, "getSessionTokenWithoutUserPassword")
        .mockResolvedValue(null)
      try {
        await guard.hasUserValidSessionToken(req)
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect(error.name).toEqual("ForbiddenException")
        expect(error.message).toEqual(AuthError.Forbidden)
      }
      expect(getSessionTokenWithoutUserPassword).toBeCalledWith(
        { id: TOKEN.id },
        false
      )
    })

    it("should throw an error if token has expired", async () => {
      const req = {
        cookies: {
          "session-token": TOKEN.id,
        },
      } as unknown as Request
      const getSessionTokenWithoutUserPassword = jest
        .spyOn(tokenService, "getSessionTokenWithoutUserPassword")
        .mockResolvedValue(TOKEN as TokenWithoutUserPassword)
      const isTokenValid = jest
        .spyOn(tokenService, "isTokenValid")
        .mockReturnValue(false)
      try {
        await guard.hasUserValidSessionToken(req)
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect(error.name).toEqual("ForbiddenException")
        expect(error.message).toEqual(AuthError.SessionExpired)
      }
      expect(getSessionTokenWithoutUserPassword).toBeCalledWith(
        { id: TOKEN.id },
        false
      )
      expect(isTokenValid).toBeCalledWith(TOKEN)
    })

    it("should return true if the session token is valid", async () => {
      const req = {
        cookies: {
          "session-token": TOKEN.id,
        },
      } as unknown as Request
      const getSessionTokenWithoutUserPassword = jest
        .spyOn(tokenService, "getSessionTokenWithoutUserPassword")
        .mockResolvedValue(TOKEN as TokenWithoutUserPassword)
      const isTokenValid = jest
        .spyOn(tokenService, "isTokenValid")
        .mockReturnValue(true)
      const result = await guard.hasUserValidSessionToken(req)
      expect(result).toEqual(true)
      expect(getSessionTokenWithoutUserPassword).toBeCalledWith(
        { id: TOKEN.id },
        false
      )
      expect(isTokenValid).toBeCalledWith(TOKEN)
    })
  })

  describe("HasUserNoSessionToken", () => {
    it("should throw an error if there is a session cookie", async () => {
      const req = {
        cookies: {
          "session-token": TOKEN.id,
        },
      } as unknown as Request
      try {
        await guard.hasUserNoSessionToken(req)
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        expect(error.name).toEqual("ForbiddenException")
        expect(error.message).toEqual(AuthError.AlreadyLoggedIn)
      }
    })

    it("should return true if there is no session cookie", async () => {
      const req = {
        cookies: {},
      } as unknown as Request
      const result = await guard.hasUserNoSessionToken(req)
      expect(result).toEqual(true)
    })
  })

  describe("CanActivate", () => {
    it("should return true if the path requires no session cookie", async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: {},
            url: "/auth/register",
          }),
        }),
      } as unknown as ExecutionContext
      const hasUserNoSessionToken = jest
        .spyOn(guard, "hasUserNoSessionToken")
        .mockResolvedValue(true)
      const result = await guard.canActivate(context)
      expect(result).toEqual(true)
      expect(hasUserNoSessionToken).toBeCalled()
    })

    it("should return true if the path requires a session cookie and the user has a valid session token", async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: {
              "session-token": TOKEN.id,
            },
            url: "/auth/logout",
          }),
        }),
      } as unknown as ExecutionContext
      const hasUserValidSessionToken = jest
        .spyOn(guard, "hasUserValidSessionToken")
        .mockResolvedValue(true)
      const result = await guard.canActivate(context)
      expect(result).toEqual(true)
      expect(hasUserValidSessionToken).toBeCalled()
    })
  })
})
