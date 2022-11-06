import {
  Controller,
  Get,
  Param,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ParseIntPipe,
} from "@nestjs/common"

import { UserService } from "../service/user.service"
import { UserWithoutPassword } from "../types"

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieve a user by id
   *
   * @param  id - The id of the user.
   * @returns The user.
   */
  @Get(":id")
  async get(@Param("id", ParseIntPipe) id: number) {
    try {
      const user = await this.userService.getUser({ id })
      if (!user) throw new NotFoundException("User not found !")

      return new UserWithoutPassword(user)
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new InternalServerErrorException()
    }
  }
}
