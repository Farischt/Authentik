const bcrypt = require("bcryptjs")
import { Injectable } from "@nestjs/common"
import {
  User,
  AccountConfirmationToken,
  Prisma,
  SessionToken,
} from "@prisma/client"
import { Response, Request } from "express"

import { RedisService } from "../../cache/redis.service"
import { PrismaService } from "../../database/prisma.service"
import { UserService } from "../../user/service/user.service"
import { CreateUserDto, UserWithoutPassword } from "../../user/types"
import { SessionDataFromCache, SessionTokenWithoutUserPassword } from "../types"

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10
  private readonly SESSION_TOKEN_EXPIRATION = 60 * 60 // 1 hour in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private redis: RedisService
  ) {}

  /**
   * Check either if an email is available or not
   *
   * @param email
   * @returns true if available, false if not
   */
  public async isEmailAvailable(email: User["email"]): Promise<boolean> {
    return (await this.userService.getUser({ email })) === null
  }

  /**
   * Create a new user
   *
   * @param input The user to create data
   * @returns User created
   */
  public async createUser(input: CreateUserDto): Promise<User> {
    return await this.userService.createUser(input)
  }

  public async getUser(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return await this.userService.getUser(userWhereUniqueInput)
  }

  /* -------------------------------------------------------------------------- */
  /*                             Password management                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Check if the password is long enough
   *
   * @param password The password to check
   * @returns true if the password is long enough, false if not
   */
  public isPasswordLongEnough(password: User["password"]): boolean {
    return password.length >= 8
  }

  /**
   * Check if the user can login
   * @param user The user to check
   * @returns true if the user can login, false if not
   */
  public isUserAuthorizedToLogin(user: User): boolean {
    return user.isVerified
  }

  /**
   * Check if the password is strong enough
   *
   * @param password The password to check
   * @returns true if the password is strong enough, false if not
   */
  public isPasswordStrong(password: User["password"]): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(password)
  }

  /**
   * Hash a password
   *
   * @param password The password to hash
   * @returns The hashed password
   */
  public async hashPassword(password: User["password"]): Promise<string> {
    return await bcrypt.hash(password, await bcrypt.genSalt(this.SALT_ROUNDS))
  }

  /**
   * Compare a password with a hashed password
   * @param password The password to compare
   * @param hash The hashed password to compare
   * @returns true if the password is the same as the hashed password, false if not
   */
  public async comparePassword(
    password: User["password"],
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Check token validity (expiration date)
   * @param token The token to check
   * @returns true if the token is valid, false if not
   */
  public isTokenValid(token: AccountConfirmationToken | SessionToken): boolean {
    const tokenCreationDate = new Date(token.createdAt)
    const tokenExpirationDate = new Date(
      tokenCreationDate.getTime() + this.SESSION_TOKEN_EXPIRATION * 1000
    )
    return tokenExpirationDate > new Date()
  }

  /* -------------------------------------------------------------------------- */
  /*                                Session                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Retrieve a session token by its unique input
   * @param sessionTokenWhereUniqueInput The session token's id or userId to retrieve
   * @returns The session token including the user
   */
  public async getSessionToken(
    sessionTokenWhereUniqueInput: Prisma.SessionTokenWhereUniqueInput
  ): Promise<SessionTokenWithoutUserPassword> {
    const sessionToken = await this.prisma.sessionToken.findUnique({
      where: sessionTokenWhereUniqueInput,
      include: { user: true },
    })
    return { ...sessionToken, user: { ...sessionToken.user, password: null } }
  }

  /**
   * Retrieve a session token by its id
   * @param tokenId The session token's id to retrieve
   * @returns The session token
   */
  public async getSessionTokenById(
    tokenId: SessionToken["id"]
  ): Promise<SessionToken> {
    const { token } = await this.redis.get<SessionDataFromCache>(tokenId)
    if (token) return token
    return await this.getSessionToken({
      id: tokenId,
    })
  }

  /**
   * Create a new session token
   * @param data The session token's data to create
   * @returns The created session token
   */
  public async createSessionToken(
    data: Prisma.SessionTokenCreateInput
  ): Promise<SessionToken> {
    return await this.prisma.sessionToken.create({
      data,
    })
  }

  /**
   * Delete a session token
   * @param sessionTokenWhereUniqueInput The session token's id or userId to delete
   * @returns The deleted session token
   */
  public async deleteSessionToken(
    sessionTokenWhereUniqueInput: Prisma.SessionTokenWhereUniqueInput
  ): Promise<SessionToken> {
    return await this.prisma.sessionToken.delete({
      where: sessionTokenWhereUniqueInput,
    })
  }

  /**
   * set a session token in the response cookie
   * @param res The response
   * @param token The session token to set
   * @returns The response with the session token cookie
   */
  public async setSessionCookie(
    res: Response,
    token: SessionToken,
    user: User
  ): Promise<void> {
    await this.redis.set<SessionDataFromCache>(
      token.id,
      {
        token,
        user: {
          ...user,
          password: null,
        },
      },
      {
        ttl: this.SESSION_TOKEN_EXPIRATION,
      }
    )
    res.cookie("session-token", token.id, {
      // 1 hour in ms
      maxAge: this.SESSION_TOKEN_EXPIRATION * 1000,
      httpOnly: true,
    })
  }

  public getSessionCookie(req: Request): string {
    return req.cookies["session-token"]
  }

  private async getAuthenticatedUserFromCache(
    req: Request
  ): Promise<UserWithoutPassword> {
    const { user } = await this.redis.get<SessionDataFromCache>(
      this.getSessionCookie(req)
    )
    return user
  }

  private async getAuthenticatedUserFromDb(
    req: Request
  ): Promise<UserWithoutPassword> {
    const { user } = await this.getSessionToken({
      id: this.getSessionCookie(req),
    })
    return user
  }

  public async getAuthenticatedUser(
    req: Request
  ): Promise<UserWithoutPassword> {
    return (
      (await this.getAuthenticatedUserFromCache(req)) ||
      (await this.getAuthenticatedUserFromDb(req))
    )
  }

  /**
   * Delete a session token from the response cookie and the redis cache
   * @param res The response
   * @param tokenId The session tokenId to delete
   * @returns The response with the session token cookie deleted
   */
  public async removeSessionCookie(
    res: Response,
    tokenId: SessionToken["id"]
  ): Promise<void> {
    await this.redis.del(tokenId)
    res.clearCookie("session-token")
  }

  /* -------------------------------------------------------------------------- */
  /*                            Account Confirmation                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Retrieve an account confirmation token by its unique input (id or userId)
   * @param  accountConfirmationTokenWhereUniqueInput The account confirmation token's id or userId to retrieve
   * @returns The account confirmation token
   */
  public async getAccountConfirmationToken(
    accountConfirmationTokenWhereUniqueInput: Prisma.AccountConfirmationTokenWhereUniqueInput
  ): Promise<AccountConfirmationToken> {
    return await this.prisma.accountConfirmationToken.findUnique({
      where: accountConfirmationTokenWhereUniqueInput,
    })
  }

  /**
   * Creates a new account confirmation token
   * @param data The account confirmation data to create
   * @returns The created account confirmation token
   */
  public async createAccountConfirmationToken(
    data: Prisma.AccountConfirmationTokenCreateInput
  ): Promise<AccountConfirmationToken> {
    return await this.prisma.accountConfirmationToken.create({
      data,
    })
  }

  /**
   * Delete an account confirmation token
   * @param accountConfirmationTokenWhereUniqueInput The account confirmation token's id or userId to delete
   * @returns The deleted account confirmation token
   */
  private async deleteAccountConfirmationToken(
    accountConfirmationTokenWhereUniqueInput: Prisma.AccountConfirmationTokenWhereUniqueInput
  ): Promise<AccountConfirmationToken> {
    return await this.prisma.accountConfirmationToken.delete({
      where: accountConfirmationTokenWhereUniqueInput,
    })
  }

  /**
   *
   * @param userId
   * @returns The confirmed user
   */
  public async confirmAccount(userId: User["id"]): Promise<User> {
    const user = await this.userService.updateUser(
      { id: userId },
      { isVerified: true }
    )
    await this.deleteAccountConfirmationToken({ userId })
    return user
  }
}
