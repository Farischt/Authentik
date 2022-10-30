import { Injectable } from "@nestjs/common"
import { User, Prisma } from "@prisma/client"

import { PrismaService } from "../../database/prisma.service"

// type UserCreateDTO = Prisma.UserCreateArgs["data"]

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput
  ): Promise<User> {
    return await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    })
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    })
  }
}
