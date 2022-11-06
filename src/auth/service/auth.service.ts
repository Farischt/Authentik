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
import { CacheSessionData, Token, TokenWithoutUserPassword } from "../types"

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
   * Get a user
   *
   * @param userWhereUniqueInput the user's unique input (id, email, etc.)
   * @returns The user
   */
  public async getUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput
  ): Promise<User> {
    return await this.userService.getUser(userWhereUniqueInput)
  }

  /**
   * Create a new user
   *
   * @param input The user to create data
   * @returns The created user
   */
  public async createUser(input: CreateUserDto): Promise<User> {
    return await this.userService.createUser(input)
  }

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
   * Check if the user is verified
   *
   * @param user The user to check
   * @returns true if the user can login, false if not
   */
  public isUserVerified(user: User): boolean {
    return user.isVerified
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
   * Check if the password is strong enough
   *
   * @param password The password to check
   * @returns true if the password is strong enough, false if not
   */
  public isPasswordStrongEnough(password: User["password"]): boolean {
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
   *
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

  /* -------------------------------------------------------------------------- */
  /*                             Token management                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Check token validity (expiration date)
   *
   * @param token The token to check
   * @returns true if the token is valid, false if not
   */
  public isTokenValid(token: Token): boolean {
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
   *
   * @param sessionTokenWhereUniqueInput the token's unique input (id)
   * @param includeUser true if the user should be included in the result, false if not
   * @returns The session token including the user or not
   */
  public async getSessionTokenWithoutUserPassword(
    sessionTokenWhereUniqueInput: Prisma.SessionTokenWhereUniqueInput,
    includeUser = true
  ): Promise<TokenWithoutUserPassword> {
    const sessionToken = await this.prisma.sessionToken.findUnique({
      where: sessionTokenWhereUniqueInput,
      include: {
        user: includeUser,
      },
    })

    if (!sessionToken) return null
    else if (includeUser && sessionToken.user)
      return {
        ...sessionToken,
        user: new UserWithoutPassword(sessionToken.user),
      }

    return sessionToken
  }

  /**
   * Create a new session token
   *
   * @param userId The user's id
   * @param ipAddr The user's ip address
   * @returns The created session token
   */
  public async createSessionToken(
    userId: User["id"],
    ipAddr: string
  ): Promise<SessionToken> {
    return await this.prisma.sessionToken.create({
      data: { user: { connect: { id: userId } }, ipAddr },
    })
  }

  /**
   * Delete a session token
   *
   * @param sessionTokenWhereUniqueInput The session token's unique input (id)
   * @returns The deleted session token
   */
  private async deleteSessionToken(
    sessionTokenWhereUniqueInput: Prisma.SessionTokenWhereUniqueInput
  ): Promise<SessionToken | null> {
    return await this.prisma.sessionToken.delete({
      where: sessionTokenWhereUniqueInput,
    })
  }

  /**
   * Get the session token id from the request cookie
   *
   * @param req The request
   * @returns The session token id
   */
  public getSessionCookie(req: Request): string {
    return req.cookies["session-token"]
  }

  /**
   * set a session token in the response cookie
   *
   * @param res The response
   * @param token The session token to set
   */
  public async setSessionCookie(
    res: Response,
    token: SessionToken,
    user: User
  ): Promise<void> {
    await this.redis.set<CacheSessionData>(
      token.id,
      {
        token,
        user: new UserWithoutPassword(user),
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

  /**
   * Remove a session token from the response cookie and the redis cache
   *
   * @param res The response
   * @param tokenId The session tokenId to remove
   */
  public async removeSessionCookie(
    res: Response,
    tokenId: SessionToken["id"]
  ): Promise<void> {
    await this.redis.del(tokenId)
    res.clearCookie("session-token")
  }

  /**
   * Get the authenticated user from the cache
   *
   * @param req The request
   * @returns The authenticated user
   */
  private async getAuthenticatedUserFromCache(
    req: Request
  ): Promise<UserWithoutPassword> {
    const session = await this.redis.get<CacheSessionData>(
      this.getSessionCookie(req)
    )
    if (!session) return null
    return session.user
  }

  /**
   * Get the authenticated user from the database (to be used when the user is not in the cache)
   *
   * @param req The request
   * @returns The authenticated user
   */
  private async getAuthenticatedUserFromDb(
    req: Request
  ): Promise<UserWithoutPassword> {
    const session = await this.getSessionTokenWithoutUserPassword({
      id: this.getSessionCookie(req),
    })
    if (!session) return null
    return session.user
  }

  /**
   * Get the authenticated user from the cache or the database
   *
   * @param req The request
   * @returns The authenticated user
   */
  public async getAuthenticatedUser(
    req: Request
  ): Promise<UserWithoutPassword> {
    return (
      (await this.getAuthenticatedUserFromCache(req)) ||
      (await this.getAuthenticatedUserFromDb(req))
    )
  }

  /* -------------------------------------------------------------------------- */
  /*                            Account Confirmation                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Retrieve an account confirmation token by its unique input (id or userId)
   *
   * @param accountConfirmationTokenWhereUniqueInput The account confirmation token's unique input (id or userId)
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
   * Create a new account confirmation token
   *
   * @param userId The user id to connect to
   * @returns The created account confirmation token
   */
  public async createAccountConfirmationToken(
    userId: User["id"]
  ): Promise<AccountConfirmationToken> {
    return await this.prisma.accountConfirmationToken.create({
      data: { user: { connect: { id: userId } } },
    })
  }

  /**
   * Delete an account confirmation token
   *
   * @param accountConfirmationTokenWhereUniqueInput The account confirmation token's unique input (id or userId)
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
   * Verify the user's account and delete the account confirmation token
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
