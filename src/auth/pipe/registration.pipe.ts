import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common"
import { CreateUserDto } from "../../user/types"
import { AuthService } from "../service/auth.service"
import { AuthError } from "../types"

@Injectable()
export class RegistrationPipe implements PipeTransform {
  constructor(private readonly authService: AuthService) {}

  async transform(input: CreateUserDto) {
    const { email, password, firstName, lastName } = input
    if (!email || typeof email !== "string") {
      throw new BadRequestException(AuthError.EmailRequired)
    } else if (!password || typeof password !== "string") {
      throw new BadRequestException(AuthError.PasswordRequired)
    } else if (!firstName || typeof firstName !== "string") {
      throw new BadRequestException(AuthError.FirstNameRequired)
    } else if (!lastName || typeof lastName !== "string") {
      throw new BadRequestException(AuthError.LastNameRequired)
    } else if (!(await this.authService.isEmailAvailable(email))) {
      throw new BadRequestException(AuthError.EmailUnavailable)
    } else if (!this.authService.isPasswordLongEnough(password)) {
      throw new BadRequestException(AuthError.PasswordNotLong)
    } else if (!this.authService.isPasswordStrongEnough(password)) {
      throw new BadRequestException(AuthError.PasswordNotStrong)
    }

    return input
  }
}
