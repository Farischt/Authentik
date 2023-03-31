import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common"
import { LoginDto } from "../../types"
import { AuthService } from "../../service/auth.service"
import { AuthError } from "../../types"

@Injectable()
export class LoginValidationPipe implements PipeTransform {
  constructor(private readonly authService: AuthService) {}

  // TODO: use class validator
  async transform(input: LoginDto) {
    // Check input
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
