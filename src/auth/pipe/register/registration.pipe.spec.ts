import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"

import { RegisterValidationPipe } from "./registration.pipe"
import { RedisModule } from "../../../cache/redis.module"
import { AuthService } from "../../service/auth.service"
import { PrismaModule } from "../../../database/prisma.module"
import { PrismaService } from "../../../database/prisma.service"
import { ConfigurationModule as ConfigModule } from "../../../config/config.module"
import { UserService } from "../../../user/service/user.service"
import { TokenService } from "../../../token/service/token.service"
import { AuthError } from "../../types"
import { CreateUserDto } from "../../../user/types"

describe("Register validation pipe", () => {
  let authService: AuthService
  let prismaService: PrismaService
  let pipe: RegisterValidationPipe

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, PrismaModule, ConfigModule],
      providers: [AuthService, UserService, TokenService],
    }).compile()

    authService = app.get<AuthService>(AuthService)
    prismaService = app.get<PrismaService>(PrismaService)
    pipe = new RegisterValidationPipe(authService)
  })

  afterAll(async () => {
    await prismaService.$disconnect()
  })

  it("should be defined", () => {
    expect(authService).toBeDefined()
    expect(pipe).toBeDefined()
  })

  it("should throw an error if email is not provided", async () => {
    const input: CreateUserDto = {
      email: "",
      password: "password",
      firstName: "test",
      lastName: "test",
    }
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.EmailRequired)
    }
  })

  it("should throw an error if password is not provided", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "",
      firstName: "test",
      lastName: "test",
    }
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.PasswordRequired)
    }
  })

  it("should throw an error if first name is not provided", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "password",
      firstName: "",
      lastName: "test",
    }
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.FirstNameRequired)
    }
  })

  it("should throw an error if last name is not provided", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "password",
      firstName: "test",
      lastName: "",
    }
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.LastNameRequired)
    }
  })

  it("should throw an error if email is not available", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "password",
      firstName: "test",
      lastName: "test",
    }
    const isEmailAvailable = jest
      .spyOn(authService, "isEmailAvailable")
      .mockResolvedValue(false)
    try {
      await pipe.transform(input)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.name).toEqual("BadRequestException")
      expect(error.message).toEqual(AuthError.EmailUnavailable)
    }
    expect(isEmailAvailable).toHaveBeenCalledWith(input.email)
  })

  it("should throw an error if password is not long enough", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "pass",
      firstName: "test",
      lastName: "test",
    }
    const isEmailAvailable = jest
      .spyOn(authService, "isEmailAvailable")
      .mockResolvedValue(true)
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
    expect(isEmailAvailable).toHaveBeenCalledWith(input.email)
    expect(isPasswordLongEnough).toHaveBeenCalledWith(input.password)
  })

  it("should throw an error if password is not strong enough", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "passsssssss",
      firstName: "test",
      lastName: "test",
    }
    const isEmailAvailable = jest
      .spyOn(authService, "isEmailAvailable")
      .mockResolvedValue(true)
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
    expect(isEmailAvailable).toHaveBeenCalledWith(input.email)
    expect(isPasswordLongEnough).toHaveBeenCalledWith(input.password)
    expect(isPasswordStrongEnough).toHaveBeenCalledWith(input.password)
  })

  it("should return the input if it is valid", async () => {
    const input: CreateUserDto = {
      email: "email",
      password: "passsssssss",
      firstName: "test",
      lastName: "test",
    }
    const isEmailAvailable = jest
      .spyOn(authService, "isEmailAvailable")
      .mockResolvedValue(true)
    const isPasswordLongEnough = jest
      .spyOn(authService, "isPasswordLongEnough")
      .mockReturnValue(true)
    const isPasswordStrongEnough = jest
      .spyOn(authService, "isPasswordStrongEnough")
      .mockReturnValue(true)

    const result = await pipe.transform(input)
    expect(result).toEqual(input)
    expect(isEmailAvailable).toHaveBeenCalledWith(input.email)
    expect(isPasswordLongEnough).toHaveBeenCalledWith(input.password)
    expect(isPasswordStrongEnough).toHaveBeenCalledWith(input.password)
  })
})
