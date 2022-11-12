import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common"
import { Request } from "express"
import { TokenService } from "../../token/service/token.service"
import { AuthError } from "../types"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * Check if the incoming request has a valid session token
   *
   * @param request the incoming request
   * @returns true if the session token is valid
   * @throws ForbiddenException otherwise
   */
  public async hasUserValidSessionToken(request: Request): Promise<boolean> {
    if (!request.cookies["session-token"])
      throw new ForbiddenException(AuthError.NoSessionCookie)

    const session = await this.tokenService.getSessionTokenWithoutUserPassword(
      { id: request.cookies["session-token"] as string },
      false
    )

    if (!session) throw new ForbiddenException(AuthError.Forbidden)
    else if (!this.tokenService.isTokenValid(session))
      throw new ForbiddenException(AuthError.SessionExpired)

    return true
  }

  /**
   * Check if the incoming request has no session token
   *
   * @param request the incoming request
   * @returns true if the incoming request has no session token
   * @throws ForbiddenException otherwise
   */
  public async hasUserNoSessionToken(request: Request): Promise<boolean> {
    if (request.cookies["session-token"])
      throw new ForbiddenException(AuthError.AlreadyLoggedIn)

    return true
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    if (
      request.url === "/auth/login" ||
      request.url === "/auth/register" ||
      request.url.includes("/auth/confirm-account/")
    ) {
      return await this.hasUserNoSessionToken(request)
    }

    return await this.hasUserValidSessionToken(request)
  }
}
