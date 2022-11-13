import { Module } from "@nestjs/common"
import { AuthService } from "./service/auth.service"
import { AuthController } from "./controller/auth.controller"
import { UserService } from "../user/service/user.service"
import { TokenService } from "../token/service/token.service"
import { MailModule } from "../mail/mail.module"

@Module({
  imports: [MailModule],
  providers: [AuthService, UserService, TokenService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
