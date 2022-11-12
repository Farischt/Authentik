import {
  Req,
  Res,
  Body,
  Param,
  Controller,
  Get,
  Patch,
  Post,
  BadRequestException,
  NotFoundException,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common"
import { Request, Response } from "express"

import { CreateUserDto, SerializedUser } from "../../user/types"
import { AuthGuard } from "../guard/auth.guard"
import { RegisterValidationPipe } from "../pipe/register/registration.pipe"
import { LoginValidationPipe } from "../pipe/login/login.pipe"
import { AuthService } from "../service/auth.service"
import { TokenService } from "../../token/service/token.service"
import { LoginDto, AuthConfirmAcountResponseType, AuthError } from "../types"

@UseGuards(AuthGuard)
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService
  ) {}

  /**
   * Route to register a new user
   *
   * @param input Registration data
   * @returns Serialized user
   */
  @Post("register")
  async register(
    @Body(RegisterValidationPipe) input: CreateUserDto
  ): Promise<SerializedUser> {
    const { email, password, firstName, lastName } = input
    const hashedPassword = await this.authService.hashPassword(password)
    const user = await this.authService.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    })
    await this.tokenService.createAccountConfirmationToken(user.id)
    return new SerializedUser(user)
  }

  /**
   * Route to confirm a user email and account
   *
   * @param token the token id
   * @returns the user email with a success message
   */
  @Patch("confirm-account/:token")
  async confirmAccount(
    @Param("token", ParseUUIDPipe) token: string
  ): Promise<AuthConfirmAcountResponseType> {
    const accountConfirmationToken =
      await this.tokenService.getAccountConfirmationToken({ id: token })
    if (!accountConfirmationToken)
      throw new BadRequestException(AuthError.InvalidToken)
    // Since the confirm account delete the account token, this condition is never reached if a user is already verified
    // if (
    //   this.authService.isUserVerified(
    //     await this.authService.getUser({
    //       id: accountConfirmationToken.userId,
    //     })
    //   )
    // )
    //   throw new BadRequestException(AuthError.AlreadyConfirmed)
    /** This update the user and delete the token */
    const user = await this.authService.confirmAccount(
      accountConfirmationToken.userId
    )
    if (!user) throw new NotFoundException("Couldn't confirm account !")
    return {
      message: "Successfully confirmed your email ",
      email: user.email,
    }
  }

  /**
   * Route to login a user
   *
   * @param input email and password
   * @param req the request
   * @param res the response
   */
  @Post("login")
  async login(
    @Body(LoginValidationPipe) input: LoginDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { email, password } = input
    // Check if user exists
    const user = await this.authService.getUser({ email })
    if (!user) throw new BadRequestException(AuthError.InvalidCredentials)
    else if (!this.authService.isUserVerified(user)) {
      throw new BadRequestException(AuthError.InvalidCredentials)
    }
    // Check if password is correct
    if (!(await this.authService.comparePassword(password, user.password)))
      throw new BadRequestException(AuthError.InvalidCredentials)
    // Create session token
    const sessionToken = await this.tokenService.createSessionToken(
      user.id,
      req.ip
    )
    await this.authService.setSessionCookie(res, sessionToken, user)
    res.status(201).json({ message: "Logged in", loggedIn: true })
  }

  /**
   * Route to get the authenticated user
   *
   * @param req the request
   * @returns the authenticated serialized user
   */
  @Get("user")
  async getAuthenticatedUser(@Req() req: Request): Promise<SerializedUser> {
    const user = await this.authService.getAuthenticatedUser(req)
    if (!user) throw new NotFoundException(AuthError.UserNotFound)
    return user
  }

  /**
   * Route to logout a user
   *
   * @param req the request
   * @param res the response
   */
  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.authService.logout(req, res)
    res.status(200).json({ message: "Logged out", loggedIn: false })
  }
}
