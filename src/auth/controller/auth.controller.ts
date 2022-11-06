import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common"
import { Request, Response } from "express"

import { CreateUserDto, UserWithoutPassword } from "../../user/types"
import { AuthGuard } from "../guard/auth.guard"
import { RegistrationPipe } from "../pipe/registration.pipe"
import { LoginPipe } from "../pipe/login.pipe"
import { AuthService } from "../service/auth.service"
import { LoginDto, AuthError, AuthConfirmAcountResponseType } from "../types"

@UseGuards(AuthGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body(RegistrationPipe) input: CreateUserDto
  ): Promise<UserWithoutPassword> {
    const { email, password, firstName, lastName } = input

    try {
      const hashedPassword = await this.authService.hashPassword(password)
      const user = await this.authService.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      })
      await this.authService.createAccountConfirmationToken(user.id)

      return user
    } catch (error) {
      if (error instanceof HttpException) throw error
      console.log(error)
      throw new InternalServerErrorException(AuthError.Unknown)
    }
  }

  @Patch("confirm-account/:token")
  @HttpCode(204)
  async confirmAccount(
    @Param("token", ParseUUIDPipe) token: string
  ): Promise<AuthConfirmAcountResponseType> {
    try {
      const accountConfirmationToken =
        await this.authService.getAccountConfirmationToken({ id: token })

      if (!accountConfirmationToken)
        throw new BadRequestException("Invalid account confirmation token !")

      /* Removed in order to avoid case when user didn't confirm account whiting token expiration time
      if (!this.authService.isTokenValid(accountConfirmationToken))
      throw new BadRequestException("Account confirmation token expired !") */

      if (
        this.authService.isUserVerified(
          await this.authService.getUser({
            id: accountConfirmationToken.userId,
          })
        )
      )
        throw new BadRequestException("Account already confirmed !")

      /** This update the user and delete the token */
      const user = await this.authService.confirmAccount(
        accountConfirmationToken.userId
      )
      if (!user) throw new NotFoundException("Couldn't confirm account !")

      return {
        message: "Successfully confirmed your email ",
        email: user.email,
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(AuthError.Unknown)
    }
  }

  @Post("login")
  async login(
    @Body(LoginPipe) input: LoginDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const { email, password } = input
      // Check if user exists
      const user = await this.authService.getUser({ email })
      if (!user) throw new BadRequestException("Invalid credentials !")
      else if (!this.authService.isUserVerified(user)) {
        throw new BadRequestException("Invalid credentials !")
      }

      // Check if password is correct
      if (!(await this.authService.comparePassword(password, user.password)))
        throw new BadRequestException("Invalid credentials !")

      // Create session token
      const sessionToken = await this.authService.createSessionToken(
        user.id,
        req.ip
      )
      await this.authService.setSessionCookie(res, sessionToken, user)
      res.status(201).json({ message: "Logged in", loggedIn: true })
    } catch (error) {
      console.log(error)
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(AuthError.Unknown)
    }
  }

  @Get("user")
  async getAuthenticatedUser(
    @Req() req: Request
  ): Promise<UserWithoutPassword> {
    try {
      const user = await this.authService.getAuthenticatedUser(req)
      if (!user)
        throw new NotFoundException("Couldn't find authenticated user !")

      return user
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(AuthError.Unknown)
    }
  }
}
