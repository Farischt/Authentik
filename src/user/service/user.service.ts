import { Injectable } from "@nestjs/common"
import { User, Prisma, Role } from "@prisma/client"

import { PrismaService } from "../../database/prisma.service"
import { CreateUserDto } from "../types"

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a user
   *
   * @param userWhereUniqueInput the user's unique input (id, email, etc.)
   * @returns The user or null if not found
   */
  public async getUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput
  ): Promise<User> {
    return await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    })
  }

  /**
   * Create a new user
   *
   * @param data The user to create data
   * @returns The user created
   */
  public async createUser(data: CreateUserDto): Promise<User> {
    return await this.prisma.user.create({
      data,
    })
  }

  /**
   * Create a new user with a role
   *
   * @param data The user to create data without role
   * @param role The role to assign to the user
   * @returns The user created
   */
  public async createUserWithRole(
    data: Omit<CreateUserDto, "role">,
    role: Role
  ): Promise<User> {
    return await this.createUser({
      ...data,
      role,
    })
  }

  /**
   * Update a user
   *
   * @param userWhereUniqueInput the user's unique input (id, email, etc.)
   * @param data The data to update
   * @returns The user updated
   */
  public async updateUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return await this.prisma.user.update({
      where: userWhereUniqueInput,
      data,
    })
  }

  /**
   * Delete a user
   *
   * @param userWhereUniqueInput the user's unique input (id, email, etc.)
   * @returns The user deleted
   */
  public async deleteUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput
  ): Promise<User> {
    return await this.prisma.user.delete({
      where: userWhereUniqueInput,
    })
  }
}
