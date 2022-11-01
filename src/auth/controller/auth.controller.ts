import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  Req,
} from "@nestjs/common"
import { Request } from "express"
import { CreateUserDto, UserOutputDto } from "../../user/types"
import { RegistrationPipe } from "../pipe/registration.pipe"
import { AuthService } from "../service/auth.service"
import { LoginDto } from "../types"

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
      throw new InternalServerErrorException("Something went wrong !")
    }
  }

  @Post("login")
  async login(@Body() input: LoginDto, @Req() req: Request) {
    // Check if user is already logged in
  }
}
