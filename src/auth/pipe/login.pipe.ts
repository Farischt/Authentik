import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common"
import { LoginDto } from "../types"
import { AuthService } from "../service/auth.service"
import { AuthError } from "../types"

@Injectable()
export class LoginValidationPipe implements PipeTransform {
  constructor(private readonly authService: AuthService) {}

  async transform(input: LoginDto) {
    const { email, password } = input
    if (!email || typeof email !== "string") {
      throw new BadRequestException(AuthError.EmailRequired)
    } else if (!password || typeof password !== "string") {
      throw new BadRequestException(AuthError.PasswordRequired)
    } else if (!this.authService.isPasswordLongEnough(password)) {
      throw new BadRequestException(AuthError.PasswordNotLong)
    } else if (!this.authService.isPasswordStrongEnough(password)) {
      throw new BadRequestException(AuthError.PasswordNotStrong)
    }

    return input
  }
}
