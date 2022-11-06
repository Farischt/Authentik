import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  public async onModuleInit() {
    await this.$connect()
  }

  public async enableShutdownHooks(app: INestApplication) {
    this.$on("beforeExit", async () => {
      console.log(
        "\nReceived beforeExit event from Prisma Client, shutting down gracefully"
      )
      await app.close()
    })
  }
}
