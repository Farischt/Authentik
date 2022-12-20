import { MailerModule } from "@nestjs-modules/mailer"
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter"
import { Global, Module } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { join } from "path"

import { MailConfig, Configuration } from "../config"
import { MailService } from "./mail.service"

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const mailConfig = config.get<MailConfig>(Configuration.MAIL)
        return {
          transport: {
            host: mailConfig?.HOST ?? "localhost",
            secure: false,
            auth: {
              user: mailConfig?.USER ?? "user",
              pass: mailConfig?.PASSWORD ?? "password",
            },
          },
          defaults: {
            from: mailConfig?.FROM ?? "user@localhost",
          },
          template: {
            dir: join(__dirname, "templates"),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        }
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
