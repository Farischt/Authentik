import { Module } from "@nestjs/common"
import { TokenService } from "./service/token.service"

@Module({
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
