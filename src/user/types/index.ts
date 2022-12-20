import { User, Role } from "@prisma/client"

export class SerializedUser implements User {
  id: number
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  isVerified: boolean
  createdAt: Date
  updatedAt: Date

  // TODO:
  constructor(user: User) {
    Object.assign(this, user)
    this.password = "********"
  }
}

export type CreateUserDto = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "role" | "isVerified"
> &
  Partial<Pick<User, "role">>

export type UpdateUserDto = Partial<CreateUserDto>
