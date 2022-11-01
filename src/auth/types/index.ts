import { User } from "@prisma/client"

export enum AuthError {
  EmailRequired = "Email is required !",
  EmailUnavailable = "Email is unavailable !",
  FirstNameRequired = "First name is required !",
  LastNameRequired = "Last name is required !",
  PasswordRequired = "Password is required !",
  PasswordNotLong = "Password must be at least 8 characters long !",
  PasswordNotStrong = "Password must be alphanumeric and contains a special character !",
}

export type LoginDto = Pick<User, "email" | "password">
