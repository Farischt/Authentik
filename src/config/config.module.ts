import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import configuration from "../config"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: [".env"],
      load: [configuration],
    }),
  ],
})
export class ConfigurationModule {}
