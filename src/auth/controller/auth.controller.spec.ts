import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException, NotFoundException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { SessionToken, User } from "@prisma/client"
import { Request, Response } from "express"

import { RedisModule } from "../../cache/redis.module"
import { AuthController } from "./auth.controller"
import { PrismaModule } from "../../database/prisma.module"
import { PrismaService } from "../../database/prisma.service"
import { AuthService } from "../../auth/service/auth.service"
import { ConfigurationModule as ConfigModule } from "../../config/config.module"
import { UserService } from "../../user/service/user.service"
import { TokenService } from "../../token/service/token.service"
import { MailService } from "../../mail/mail.service"
import { MailModule } from "../../mail/mail.module"
import { CreateUserDto, SerializedUser } from "../../user/types"
import { Token } from "../../token/types"
import { AuthError, LoginDto } from "../types"

const CREATE_USER_INPUT: CreateUserDto = {
  email: "test@gmail.com",
  password: "Lolilollpb123",
  firstName: "Test",
  lastName: "Gmail",
}

const LOGIN_INPUT: LoginDto = {
  email: "test@gmail.com",
  password: "123456789",
}

const HASHED_PASSWORD = "123456789"

const USER: User = {
  id: 1,
  ...CREATE_USER_INPUT,
  password: HASHED_PASSWORD,
  createdAt: new Date(),
  updatedAt: new Date(),
  isVerified: false,
  role: "USER",
}

const VERIFIED_USER: User = {
  ...USER,
  isVerified: true,
}

const SERIALIZED_USER = new SerializedUser(USER)

const ACCOUNT_TOKEN: Token = {
  id: "1010101010",
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const SESSION_TOKEN: SessionToken = {
  id: "1010101010",
  userId: 1,
  ipAddr: "127.0.0.1",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("AuthController", () => {
  let controller: AuthController
  let service: AuthService
  let tokenService: TokenService
  let prismaService: PrismaService
  let mailService: MailService

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, RedisModule, PrismaModule, MailModule],
      providers: [AuthService, UserService, TokenService, ConfigService],
      controllers: [AuthController],
    }).compile()

    controller = app.get<AuthController>(AuthController)
    service = app.get<AuthService>(AuthService)
    tokenService = app.get<TokenService>(TokenService)
    prismaService = app.get<PrismaService>(PrismaService)
    mailService = app.get<MailService>(MailService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  it("should register a user", async () => {
    const hashPassword = jest
      .spyOn(service, "hashPassword")
      .mockResolvedValue(HASHED_PASSWORD)
    const createUser = jest.spyOn(service, "createUser").mockResolvedValue(USER)
    const createAccountConfirmationToken = jest
      .spyOn(tokenService, "createAccountConfirmationToken")
      .mockResolvedValue(ACCOUNT_TOKEN)
    const mailer = jest
      .spyOn(mailService, "sendAccountConfirmation")
      .mockResolvedValue()
    const result = await controller.register(CREATE_USER_INPUT)
    expect(result).toEqual(SERIALIZED_USER)
    expect(hashPassword).toBeCalledWith(CREATE_USER_INPUT.password)
    expect(createUser).toBeCalledWith({
      ...CREATE_USER_INPUT,
      password: HASHED_PASSWORD,
    })
    expect(mailer).toBeCalledTimes(1)
    expect(createAccountConfirmationToken).toBeCalledWith(USER.id)
  })

  describe("Confirm user account", () => {
    it("should throw an error if token is invalid", async () => {
      const getAccountConfirmationToken = jest
        .spyOn(tokenService, "getAccountConfirmationToken")
        .mockResolvedValue(null)
      try {
        await controller.confirmAccount(ACCOUNT_TOKEN.id)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error.name).toEqual("BadRequestException")
        expect(error.message).toEqual("Invalid token")
      }
      expect(getAccountConfirmationToken).toBeCalledWith({
        id: ACCOUNT_TOKEN.id,
      })
    })

    it("should throw an error if couldn't confirm the user account", async () => {
      const getAccountConfirmationToken = jest
        .spyOn(tokenService, "getAccountConfirmationToken")
        .mockResolvedValue(ACCOUNT_TOKEN)
      const confirmAccount = jest
        .spyOn(service, "confirmAccount")
        .mockResolvedValue({} as User)

      try {
        await controller.confirmAccount(ACCOUNT_TOKEN.id)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error.name).toEqual("NotFoundException")
        expect(error.message).toEqual("Couldn't confirm account !")
      }
      expect(getAccountConfirmationToken).toBeCalledWith({
        id: ACCOUNT_TOKEN.id,
      })
      expect(confirmAccount).toBeCalledWith(ACCOUNT_TOKEN.userId)
    })

    it("should confirm the user account", async () => {
      const getAccountConfirmationToken = jest
        .spyOn(tokenService, "getAccountConfirmationToken")
        .mockResolvedValue(ACCOUNT_TOKEN)
      const confirmAccount = jest
        .spyOn(service, "confirmAccount")
        .mockResolvedValue(VERIFIED_USER)
      const result = await controller.confirmAccount(ACCOUNT_TOKEN.id)
      expect(result).toEqual({
        message: "Successfully confirmed your email ",
        email: VERIFIED_USER.email,
      })
      expect(getAccountConfirmationToken).toBeCalledWith({
        id: ACCOUNT_TOKEN.id,
      })
      expect(confirmAccount).toBeCalledWith(ACCOUNT_TOKEN.userId)
    })
  })

  describe("Login", () => {
    it("should throw an error if user is not found", async () => {
      const requestMock = {} as unknown as Request
      const responseMock = {} as unknown as Response
      const getUser = jest.spyOn(service, "getUser").mockResolvedValue(null)
      try {
        await controller.login(LOGIN_INPUT, requestMock, responseMock)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error.name).toEqual("BadRequestException")
        expect(error.message).toEqual(AuthError.InvalidCredentials)
      }
      expect(getUser).toBeCalledWith({ email: LOGIN_INPUT.email })
    })

    it("should throw an error if user is not verified", async () => {
      const requestMock = {} as unknown as Request
      const responseMock = {} as unknown as Response
      const getUser = jest.spyOn(service, "getUser").mockResolvedValue(USER)
      const isUserVerified = jest
        .spyOn(service, "isUserVerified")
        .mockReturnValue(false)
      try {
        await controller.login(LOGIN_INPUT, requestMock, responseMock)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error.name).toEqual("BadRequestException")
        expect(error.message).toEqual(AuthError.InvalidCredentials)
      }
      expect(getUser).toBeCalledWith({ email: LOGIN_INPUT.email })
      expect(isUserVerified).toBeCalledWith(USER)
    })

    it("should throw an error if passwords are not the same", async () => {
      const requestMock = {} as unknown as Request
      const responseMock = {} as unknown as Response
      const getUser = jest.spyOn(service, "getUser").mockResolvedValue(USER)
      const isUserVerified = jest
        .spyOn(service, "isUserVerified")
        .mockReturnValue(true)
      const comparePassword = jest
        .spyOn(service, "comparePassword")
        .mockResolvedValue(false)

      try {
        await controller.login(LOGIN_INPUT, requestMock, responseMock)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error.name).toEqual("BadRequestException")
        expect(error.message).toEqual(AuthError.InvalidCredentials)
      }
      expect(getUser).toBeCalledWith({ email: LOGIN_INPUT.email })
      expect(isUserVerified).toBeCalledWith(USER)
      expect(comparePassword).toBeCalledWith(
        LOGIN_INPUT.password,
        USER.password
      )
    })

    it("should login a user", async () => {
      const requestMock = {
        ip: "127.0.0.1",
      } as unknown as Request
      const responseMock = {
        cookie: jest.fn(),
        status: jest.fn(() => {
          return {
            json: jest.fn(),
          }
        }),
      } as unknown as Response
      const getUser = jest.spyOn(service, "getUser").mockResolvedValue(USER)
      const isUserVerified = jest
        .spyOn(service, "isUserVerified")
        .mockReturnValue(true)
      const comparePassword = jest
        .spyOn(service, "comparePassword")
        .mockResolvedValue(true)
      const createSessionToken = jest
        .spyOn(tokenService, "createSessionToken")
        .mockResolvedValue(SESSION_TOKEN)
      const setSessionCookie = jest.spyOn(service, "setSessionCookie")
      const result = await controller.login(
        LOGIN_INPUT,
        requestMock,
        responseMock
      )
      expect(result).toEqual(undefined)
      expect(getUser).toBeCalledWith({ email: LOGIN_INPUT.email })
      expect(isUserVerified).toBeCalledWith(USER)
      expect(comparePassword).toBeCalledWith(
        LOGIN_INPUT.password,
        USER.password
      )
      expect(createSessionToken).toBeCalledWith(USER.id, requestMock.ip)
      expect(setSessionCookie).toBeCalledWith(responseMock, SESSION_TOKEN, USER)
      expect(responseMock.status).toBeCalledWith(201)
    })
  })

  describe("Get autenticatedUser", () => {
    it("should throw an error if user is not found", async () => {
      const requestMock = {
        cookies: {
          "session-token": undefined,
        },
      } as unknown as Request
      const getAuthenticatedUser = jest
        .spyOn(service, "getAuthenticatedUser")
        .mockResolvedValue(null)
      try {
        await controller.getAuthenticatedUser(requestMock)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error.name).toEqual("NotFoundException")
        expect(error.message).toEqual(AuthError.UserNotFound)
      }
      expect(getAuthenticatedUser).toBeCalledWith(requestMock)
    })

    it("should get authenticated user", async () => {
      const requestMock = {
        cookies: {
          "session-token": SESSION_TOKEN.id,
        },
      } as unknown as Request
      const getAuthenticatedUser = jest
        .spyOn(service, "getAuthenticatedUser")
        .mockResolvedValue(SERIALIZED_USER)
      const result = await controller.getAuthenticatedUser(requestMock)
      expect(result).toEqual(SERIALIZED_USER)
      expect(getAuthenticatedUser).toBeCalledWith(requestMock)
    })
  })

  it("should log out a user", async () => {
    const requestMock = {
      cookies: {
        "session-token": SESSION_TOKEN.id,
      },
    } as unknown as Request
    const responseMock = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn(() => {
        return {
          json: jest.fn(),
        }
      }),
    } as unknown as Response
    const deleteSessionToken = jest
      .spyOn(tokenService, "deleteSessionToken")
      .mockResolvedValue(null)
    const result = await controller.logout(requestMock, responseMock)
    expect(result).toEqual(undefined)
    expect(deleteSessionToken).toBeCalledWith({ id: SESSION_TOKEN.id })
    expect(responseMock.clearCookie).toBeCalledWith("session-token")
  })
})
