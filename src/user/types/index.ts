import { User } from "@prisma/client"

export type CreateUserDto = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "role" | "isVerified"
> &
  Partial<Pick<User, "role">>

export type UpdateUserDto = Partial<CreateUserDto>

export type UserWithoutPassword = Omit<User, "password"> & {
  password: null
}
