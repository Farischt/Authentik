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

  private async isUserAuthenticated(request: Request): Promise<boolean> {
    if (!request.cookies.session)
      throw new ForbiddenException(
        "No session cookie found. Please login to continue."
      )

    const session = await this.authService.getSessionTokenById(
      request.cookies.session as string
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

  private async isUserUnauthenticated(request: Request): Promise<boolean> {
    if (request.cookies.session)
      throw new ForbiddenException("You are already logged in")

    return true
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    if (["/auth/login"].includes(request.url)) {
      return await this.isUserUnauthenticated(request)
    }

    return await this.isUserAuthenticated(request)
  }
}
