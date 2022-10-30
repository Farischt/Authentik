import {
  Controller,
  Get,
  Param,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common"
import { User } from "@prisma/client"

import { UserService } from "../service/user.service"

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieve a user by id
   * @constructor
   * @param {string} id - The id of the user.
   *
   */
  @Get(":id")
  async get(@Param("id") id: string) {
    try {
      if (typeof id !== "string" || isNaN(parseInt(id))) {
        throw new BadRequestException("Parameter id is required !")
      }
      const user = await this.userService.getUser({ id: parseInt(id) })
      if (!user) throw new NotFoundException("User not found !")

      return await this.userService.getUser({ id: parseInt(id) })
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new InternalServerErrorException()
    }
  }
}
