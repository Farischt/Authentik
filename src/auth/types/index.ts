import { User, SessionToken } from "@prisma/client"
import { UserWithoutPassword } from "../../user/types"

export enum AuthError {
  EmailRequired = "Email is required !",
  EmailUnavailable = "Email is unavailable !",
  EmailUnknown = "Email is unknown !",
  FirstNameRequired = "First name is required !",
  InvalidCredentials = "Invalid credentials !",
  LastNameRequired = "Last name is required !",
  PasswordRequired = "Password is required !",
  PasswordNotLong = "Password must be at least 8 characters long !",
  PasswordNotStrong = "Password must be alphanumeric and contains a special character !",
  Unknown = "Something went wrong !",
}

export enum AuthTokenError {
  InvalidToken = "Invalid token !",
  TokenExpired = "Token expired !",
}

export type LoginDto = Pick<User, "email" | "password">

export type SessionDataFromCache = {
  token: SessionToken
  user: UserWithoutPassword
}

export type SessionTokenWithoutUserPassword = Omit<SessionToken, "user"> & {
  user: UserWithoutPassword
}
