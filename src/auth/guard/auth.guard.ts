import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common"
import { Request } from "express"
import { AuthService } from "../service/auth.service"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  /**
   * Check if the incoming request has a valid session token
   *
   * @param request the incoming request
   * @returns true if the session token is valid
   * @throws ForbiddenException otherwise
   */
  private async hasUserValidSessionToken(request: Request): Promise<boolean> {
    if (!request.cookies["session-token"])
      throw new ForbiddenException(
        "No session cookie found. Please login to continue."
      )

    const session = await this.authService.getSessionTokenById(
      request.cookies["session-token"] as string
    )

    if (!session)
      throw new ForbiddenException(
        "You must be authenticated to access this ressource"
      )
    else if (!this.authService.isTokenValid(session))
      throw new ForbiddenException(
        "Your session has expired. Please login again."
      )

    return true
  }

  /**
   * Check if the incoming has no session token
   *
   * @param request the incoming request
   * @returns true if the incoming request has no session token
   * @throws ForbiddenException otherwise
   */
  private async hasUserNoSessionToken(request: Request): Promise<boolean> {
    if (request.cookies["session-token"])
      throw new ForbiddenException("You are already logged in")

    return true
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
