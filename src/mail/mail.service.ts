import { MailerService } from "@nestjs-modules/mailer"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { User, AccountConfirmationToken } from "@prisma/client"

import { Configuration, FrontAppConfig } from "../config"

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}

  public async sendAccountConfirmation(
    user: User,
    token: AccountConfirmationToken["id"]
  ) {
    const url = `${this.configService.get<FrontAppConfig["URL"]>(
      Configuration.FRONT_APP_URL
    )}/confirm-account/${token}`

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: "Welcome to Authentik! Confirm your Email",
      template: "./confirmation",
      context: {
        name: user.firstName,
        url,
        token,
      },
    })
  }
}
