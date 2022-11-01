import { Module } from "@nestjs/common"
import { AuthService } from "./service/auth.service"
import { AuthController } from "./controller/auth.controller"
import { UserService } from "../user/service/user.service"

@Module({
  imports: [],
  providers: [AuthService, UserService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
