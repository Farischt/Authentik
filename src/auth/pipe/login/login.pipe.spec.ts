import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"

import { LoginValidationPipe } from "./login.pipe"
import { RedisModule } from "../../../cache/redis.module"
import { AuthService } from "../../service/auth.service"
import { PrismaModule } from "../../../database/prisma.module"
import { PrismaService } from "../../../database/prisma.service"
import { ConfigurationModule as ConfigModule } from "../../../config/config.module"
import { UserService } from "../../../user/service/user.service"
import { TokenService } from "../../../token/service/token.service"
import { AuthError, LoginDto } from "../../types"

describe("Login validation pipe", () => {
  let authService: AuthService
  let prismaService: PrismaService
  let pipe: LoginValidationPipe

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, PrismaModule, ConfigModule],
      providers: [AuthService, UserService, TokenService],
    }).compile()

    authService = app.get<AuthService>(AuthService)
    prismaService = app.get<PrismaService>(PrismaService)
    pipe = new LoginValidationPipe(authService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(authService).toBeDefined()
    expect(pipe).toBeDefined()
  })

  it("should throw an error if email is not provided", async () => {
    const input: LoginDto = { email: "", password: "password" }
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.EmailRequired)
    }
  })

  it("should throw an error if password is not provided", async () => {
    const input: LoginDto = { email: "test@gmail.com", password: "" }
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.PasswordRequired)
    }
  })

  it("should throw an error if password is not long enough", async () => {
    const input: LoginDto = { email: "test@gmail.com", password: "123" }
    const isPasswordLongEnough = jest
      .spyOn(authService, "isPasswordLongEnough")
      .mockReturnValue(false)
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.PasswordNotLong)
    }
    expect(isPasswordLongEnough).toHaveBeenCalledWith(input.password)
  })

  it("should throw an error if password is not strong enough", async () => {
    const input: LoginDto = { email: "test@gmail.com", password: "12345678" }
    const isPasswordLongEnough = jest
      .spyOn(authService, "isPasswordLongEnough")
      .mockReturnValue(true)
    const isPasswordStrongEnough = jest
      .spyOn(authService, "isPasswordStrongEnough")
      .mockReturnValue(false)

    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.PasswordNotStrong)
    }
    expect(isPasswordLongEnough).toHaveBeenCalledWith(input.password)
    expect(isPasswordStrongEnough).toHaveBeenCalledWith(input.password)
  })

  it("should return the input if it is valid", async () => {
    const input: LoginDto = {
      email: "test@gmail.com",
      password: "12345678Abce",
    }
    const isPasswordLongEnough = jest
      .spyOn(authService, "isPasswordLongEnough")
      .mockReturnValue(true)
    const isPasswordStrongEnough = jest
      .spyOn(authService, "isPasswordStrongEnough")
      .mockReturnValue(true)

    const result = await pipe.transform(input)
    expect(isPasswordLongEnough).toHaveBeenCalledWith(input.password)
    expect(isPasswordStrongEnough).toHaveBeenCalledWith(input.password)
    expect(result).toEqual(input)
  })
})
