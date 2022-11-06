import { NestFactory } from "@nestjs/core"
import * as cookieParser from "cookie-parser"

import { AppModule } from "./app/app.module"
import { ConfigService } from "@nestjs/config"
import { LoggingInterceptor } from "./app/interceptors/logging.interceptor"
import { PrismaService } from "./database/prisma.service"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("")
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.use(cookieParser())
  await app.listen(app.get(ConfigService).get("PORT") || 3000)
  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)
}
bootstrap()
