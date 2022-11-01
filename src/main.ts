import { NestFactory } from "@nestjs/core"
import * as cookieParser from "cookie-parser"

import { AppModule } from "./app/app.module"
import { LoggingInterceptor } from "./app/interceptors/logging.interceptor"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("")
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.use(cookieParser())
  await app.listen(3000)
}
bootstrap()
