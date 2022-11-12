import { Test, TestingModule } from "@nestjs/testing"
import { Request, Response } from "express"

import { RedisModule } from "../../cache/redis.module"
import { AuthService } from "./auth.service"
import { PrismaModule } from "../../database/prisma.module"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"
import { UserService } from "../../user/service/user.service"
import { TokenService } from "../../token/service/token.service"
import { RedisService } from "../../cache/redis.service"
import { PrismaService } from "../../database/prisma.service"

import { Role, User, SessionToken } from "@prisma/client"
import { CreateUserDto, SerializedUser } from "../../user/types"
import { SessionTokenWithoutUserPassword } from "../../token/types"

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

const UNAVAILABLE_USER_EMAIL = "some@random.com"
const AVAILABLE_USER_EMAIL = "some@available.com"

const SMALL_PASSWORD = "123"
const LONG_PASSWORD = "12345678"
const WEAK_PASSWORD = "12345678"
const STRONG_PASSWORD = "12345678Aa!"
const HASHED_STRONG_PASSWORD =
  "$2a$10$1SpVbDYdGGl31ySV4WIbJe/C.kN5ILpSxNBYc8CgsvrpzecgESokG"

const IP_ADDRESS = "127.0.0.1"

const NON_EXPIRED_TOKEN: SessionToken = {
  id: "dc9151cf-c0b6-408c-9c8c-03e2da196c56",
  userId: 1,
  ipAddr: IP_ADDRESS,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const SESSION_TOKEN_WITH_USER: SessionTokenWithoutUserPassword = {
  ...NON_EXPIRED_TOKEN,
  user: USER_DATA_WITHOUT_PASSWORD,
}

const SESSION_TOKEN_FROM_CACHE = {
  token: NON_EXPIRED_TOKEN,
  user: USER_DATA_WITHOUT_PASSWORD,
}

const SESSION_COOKIE_NAME = "session-token"

describe("AuthService", () => {
  let authService: AuthService
  let userService: UserService
  let redisService: RedisService
  let prismaService: PrismaService

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ConfigModule, RedisModule],
      providers: [AuthService, UserService, TokenService],
    }).compile()

    authService = app.get<AuthService>(AuthService)
    userService = app.get<UserService>(UserService)
    redisService = app.get<RedisService>(RedisService)
    prismaService = app.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(authService).toBeDefined()
  })

  it("should return a user by id", async () => {
    const { id } = USER_DATA
    jest.spyOn(userService, "getUser").mockResolvedValue(USER_DATA)
    const user = await authService.getUser({ id })
    expect(user).toEqual(USER_DATA)
  })

  it("should return a user by email", async () => {
    const { email } = USER_DATA
    jest.spyOn(userService, "getUser").mockResolvedValue(USER_DATA)
    const user = await authService.getUser({ email })
    expect(user).toEqual(USER_DATA)
  })

  it("should create a user", async () => {
    jest.spyOn(userService, "createUser").mockResolvedValue(USER_DATA)
    const user = await authService.createUser(CREATE_USER_DATA)
    expect(user).toEqual(USER_DATA)
  })

  describe("Is email available", () => {
    it("should return true if email is available", async () => {
      jest.spyOn(userService, "getUser").mockResolvedValue(null)
      const isAvailable = await authService.isEmailAvailable(
        AVAILABLE_USER_EMAIL
      )
      expect(isAvailable).toBe(true)
    })

    it("should return false if email is not available", async () => {
      jest.spyOn(userService, "getUser").mockResolvedValue(USER_DATA)
      const isAvailable = await authService.isEmailAvailable(
        UNAVAILABLE_USER_EMAIL
      )
      expect(isAvailable).toBe(false)
    })
  })

  it("should check if user is verified", () => {
    const isVerified = authService.isUserVerified(USER_DATA)
    expect(isVerified).toBe(true)
  })

  describe("Password management", () => {
    describe("Password Length", () => {
      it("should return false", () => {
        const isValid = authService.isPasswordLongEnough(SMALL_PASSWORD)
        expect(isValid).toBe(false)
      })

      it("should return true", () => {
        const isValid = authService.isPasswordLongEnough(LONG_PASSWORD)
        expect(isValid).toBe(true)
      })
    })

    describe("Password Strength", () => {
      it("should return false", () => {
        const isValid = authService.isPasswordStrongEnough(WEAK_PASSWORD)
        expect(isValid).toBe(false)
      })

      it("should return true", () => {
        const isValid = authService.isPasswordStrongEnough(STRONG_PASSWORD)
        expect(isValid).toBe(true)
      })
    })

    it("should hash a password", async () => {
      const hashedPassword = await authService.hashPassword(STRONG_PASSWORD)
      expect(hashedPassword).not.toEqual(STRONG_PASSWORD)
    })

    describe("Password comparison", () => {
      it("should return false", async () => {
        const isValid = await authService.comparePassword(
          STRONG_PASSWORD,
          STRONG_PASSWORD
        )
        expect(isValid).toBe(false)
      })

      it("should return true", async () => {
        const isValid = await authService.comparePassword(
          STRONG_PASSWORD,
          HASHED_STRONG_PASSWORD
        )
        expect(isValid).toBe(true)
      })
    })
  })

  describe("Cookies", () => {
    it("should get the session cookie", () => {
      const requestMock = {
        cookies: {
          [SESSION_COOKIE_NAME]: NON_EXPIRED_TOKEN.id,
        },
      } as unknown as Request
      const token = authService.getSessionCookie(requestMock)
      expect(token).toEqual(NON_EXPIRED_TOKEN.id)
    })

    it("should set the session cookie", async () => {
      const cacheSetMethod = jest.spyOn(redisService, "set").mockResolvedValue()
      const responseMock = {
        cookie: jest.fn(),
      } as unknown as Response
      await authService.setSessionCookie(
        responseMock,
        NON_EXPIRED_TOKEN,
        USER_DATA
      )
      expect(cacheSetMethod).toHaveBeenCalledWith(
        NON_EXPIRED_TOKEN.id,
        {
          token: NON_EXPIRED_TOKEN,
          user: new SerializedUser(USER_DATA),
        },
        { ttl: TOKEN_TTL_IN_SECONDS }
      )
      expect(responseMock.cookie).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        NON_EXPIRED_TOKEN.id,
        {
          httpOnly: true,
          maxAge: TOKEN_TTL_IN_MS,
        }
      )
    })

    it("should remove the session cookie", async () => {
      const cacheRemoveMethod = jest.spyOn(redisService, "del")
      const responseMock = {
        clearCookie: jest.fn(),
      } as unknown as Response
      await authService.removeSessionCookie(responseMock, NON_EXPIRED_TOKEN.id)
      expect(cacheRemoveMethod).toHaveBeenCalledWith(NON_EXPIRED_TOKEN.id)
      expect(responseMock.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
    })
  })

  it("should confirm an account", async () => {
    const dbDelete = jest
      .spyOn(prismaService.accountConfirmationToken, "delete")
      .mockResolvedValue(NON_EXPIRED_TOKEN)
    const dbUpdate = jest
      .spyOn(prismaService.user, "update")
      .mockResolvedValue(USER_DATA)
    const user = await authService.confirmAccount(USER_DATA.id)
    expect(dbDelete).toHaveBeenCalledWith({
      where: { userId: USER_DATA.id },
    })
    expect(dbUpdate).toHaveBeenCalledWith({
      where: { id: USER_DATA.id },
      data: { isVerified: true },
    })
    expect(user).toEqual(USER_DATA)
  })

  describe("User management", () => {
    it("should get the authenticated user from cache", async () => {
      const cacheGetMethod = jest
        .spyOn(redisService, "get")
        .mockResolvedValue(SESSION_TOKEN_FROM_CACHE)
      const dbGetMethod = jest.spyOn(prismaService.sessionToken, "findUnique")
      const requestMock = {
        cookies: {
          [SESSION_COOKIE_NAME]: NON_EXPIRED_TOKEN.id,
        },
      } as unknown as Request
      const user = await authService.getAuthenticatedUser(requestMock)
      expect(cacheGetMethod).toHaveBeenCalledWith(NON_EXPIRED_TOKEN.id)
      expect(dbGetMethod).not.toHaveBeenCalled()
      expect(user).toEqual(USER_DATA_WITHOUT_PASSWORD)
    })

    it("should get the authenticated user from database", async () => {
      const cacheGetMethod = jest
        .spyOn(redisService, "get")
        .mockResolvedValue(null)
      const dbGetMethod = jest
        .spyOn(prismaService.sessionToken, "findUnique")
        .mockResolvedValue(SESSION_TOKEN_WITH_USER)
      const requestMock = {
        cookies: {
          [SESSION_COOKIE_NAME]: NON_EXPIRED_TOKEN.id,
        },
      } as unknown as Request
      const user = await authService.getAuthenticatedUser(requestMock)
      expect(cacheGetMethod).toHaveBeenCalledWith(NON_EXPIRED_TOKEN.id)
      expect(dbGetMethod).toHaveBeenCalledWith({
        where: { id: NON_EXPIRED_TOKEN.id },
        include: { user: true },
      })
      expect(user).toEqual(USER_DATA_WITHOUT_PASSWORD)
    })
  })
})
