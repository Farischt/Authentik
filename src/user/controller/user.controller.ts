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
import { SerializedUser } from "../types"

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
    const user = await this.userService.getUser({ id })
    if (!user) throw new NotFoundException("User not found !")

    return new SerializedUser(user)
  }
}
