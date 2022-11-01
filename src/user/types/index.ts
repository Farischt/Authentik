import { User } from "@prisma/client"

export type CreateUserDto = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "role"
> &
  Partial<Pick<User, "role">>

export type UserOutputDto = Omit<User, "password"> & {
  password: null
}

export type UpdateUserDto = Partial<CreateUserDto>
