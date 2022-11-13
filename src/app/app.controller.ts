import { Controller, Get } from "@nestjs/common"

@Controller()
export class AppController {
  constructor() {}

  @Get()
  greet(): string {
    return "Welcome to Authentik API, an authentication API developed with NestJS, by @Farischt"
  }
}
