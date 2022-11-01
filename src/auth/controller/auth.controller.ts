import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common"
import { Request } from "express"
import { CreateUserDto, UserOutputDto } from "../../user/types"
import { AuthGuard } from "../guard/auth.guard"
import { RegistrationPipe } from "../pipe/registration.pipe"
import { AuthService } from "../service/auth.service"
import { LoginDto } from "../types"
@UseGuards(AuthGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body(RegistrationPipe) input: CreateUserDto
  ): Promise<UserOutputDto> {
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

      return { ...user, password: null }
    } catch (error) {
      if (error instanceof HttpException) throw error
      console.log(error)
      throw new InternalServerErrorException("Something went wrong !")
    }
  }

  @Patch("confirm-account/:token")
  async confirmAccount(@Param("token", ParseUUIDPipe) token: string) {
    try {
      const accountConfirmationToken =
        await this.authService.getAccountConfirmationToken({ id: token })

      if (!accountConfirmationToken)
        throw new NotFoundException("Invalid account confirmation token !")

      // Check if token is expired
      if (!this.authService.isTokenValid(accountConfirmationToken))
        throw new NotFoundException("Account confirmation token expired !")

      const user = await this.authService.confirmAccount(
        accountConfirmationToken.userId
      )
      if (!user) throw new NotFoundException("Couldn't confirm account !")

      // delete token

      return {
        message: "Successfully confirmed your email ",
        ...user,
        password: null,
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException("Something went wrong !")
    }
  }

  @Post("login")
  async login(@Body() input: LoginDto, @Req() req: Request) {
    // Check if user is already logged in
  }
}
