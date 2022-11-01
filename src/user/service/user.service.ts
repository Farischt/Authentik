import { Injectable } from "@nestjs/common"
import { User, Prisma, Role } from "@prisma/client"

import { PrismaService } from "../../database/prisma.service"
import { CreateUserDto } from "../types"

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

  async createUser(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data,
    })
  }

  async createUserWithRole(data: CreateUserDto, role: Role): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        role,
      },
    })
  }

  async deleteUser(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.delete({
      where: userWhereUniqueInput,
    })
  }

  async updateUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput
  ) {
    return await this.prisma.user.update({
      where: userWhereUniqueInput,
      data,
    })
  }
}
