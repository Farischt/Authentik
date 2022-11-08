import { Injectable } from "@nestjs/common"
import {
  Prisma,
  SessionToken,
  User,
  AccountConfirmationToken,
} from "@prisma/client"

import { SerializedUser } from "../../user/types"
import { Token, TokenWithoutUserPassword } from "../types"
import { PrismaService } from "../../database/prisma.service"

@Injectable()
export class TokenService {
  private readonly SESSION_TOKEN_EXPIRATION = 60 * 60 // 1

  constructor(private readonly prisma: PrismaService) {}

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
        user: new SerializedUser(sessionToken.user),
      }

    return sessionToken
  }

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
   * Delete a session token
   *
   * @param sessionTokenWhereUniqueInput The session token's unique input (id)
   * @returns The deleted session token
   */
  public async deleteSessionToken(
    sessionTokenWhereUniqueInput: Prisma.SessionTokenWhereUniqueInput
  ): Promise<SessionToken | null> {
    return await this.prisma.sessionToken.delete({
      where: sessionTokenWhereUniqueInput,
    })
  }

  /**
   * Delete an account confirmation token
   *
   * @param accountConfirmationTokenWhereUniqueInput The account confirmation token's unique input (id or userId)
   * @returns The deleted account confirmation token
   */
  public async deleteAccountConfirmationToken(
    accountConfirmationTokenWhereUniqueInput: Prisma.AccountConfirmationTokenWhereUniqueInput
  ): Promise<AccountConfirmationToken> {
    return await this.prisma.accountConfirmationToken.delete({
      where: accountConfirmationTokenWhereUniqueInput,
    })
  }
}
