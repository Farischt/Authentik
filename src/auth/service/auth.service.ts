const bcrypt = require("bcryptjs")
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { User, Prisma, SessionToken } from "@prisma/client"
import { Response, Request } from "express"

import { TokenService } from "../../token/service/token.service"
import { RedisService } from "../../cache/redis.service"
import { UserService } from "../../user/service/user.service"
import { CreateUserDto, SerializedUser } from "../../user/types"
import { Configuration } from "../../config"
import { CacheSessionData } from "../types"

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private redis: RedisService,
    private configService: ConfigService
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
    return await bcrypt.hash(
      password,
      await bcrypt.genSalt(
        this.configService.get(Configuration.AUTH_SALT_ROUNDS)
      )
    )
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
        user: new SerializedUser(user),
      },
      {
        ttl: this.configService.get(Configuration.AUTH_TOKEN_TTL_IN_SECONDS),
      }
    )
    res.cookie("session-token", token.id, {
      maxAge: this.configService.get(Configuration.AUTH_TOKEN_TTL_IN_MS),
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
  ): Promise<SerializedUser> {
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
  ): Promise<SerializedUser> {
    const session = await this.tokenService.getSessionTokenWithoutUserPassword({
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
  public async getAuthenticatedUser(req: Request): Promise<SerializedUser> {
    return (
      (await this.getAuthenticatedUserFromCache(req)) ||
      (await this.getAuthenticatedUserFromDb(req))
    )
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
    await this.tokenService.deleteAccountConfirmationToken({ userId })
    return user
  }

  /**
   * Logout the current authenticated user
   *
   * @param req The request
   * @param res The response
   */
  public async logout(req: Request, res: Response): Promise<void> {
    const sessionCookie = this.getSessionCookie(req)
    await this.removeSessionCookie(res, sessionCookie)
    await this.tokenService.deleteSessionToken({ id: sessionCookie })
  }
}
