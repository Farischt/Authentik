import { User, SessionToken } from "@prisma/client"
import { SerializedUser } from "../../user/types"

export enum AuthError {
  EmailRequired = "Email is required !",
  EmailUnavailable = "Email is unavailable !",
  EmailUnknown = "Email is unknown !",
  FirstNameRequired = "First name is required !",
  InvalidCredentials = "Invalid credentials !",
  LastNameRequired = "Last name is required !",
  PasswordRequired = "Password is required !",
  PasswordNotLong = "Password must be at least 12 characters long !",
  PasswordNotStrong = "Password must be alphanumeric and contains a special character !",
  AlreadyLoggedIn = "Your session has expired. Please login again.",
  AlreadyConfirmed = "Your account is already confirmed !",
  SessionExpired = "Your session has expired. Please login again.",
  NoSessionCookie = "No session cookie found. Please login to continue.",
  Forbidden = "You must be authenticated to access this ressource",
  UserNotFound = "Couldn't find authenticated user !",
  InvalidToken = "Invalid token",
  Unknown = "Something went wrong !",
}

export enum AuthTokenError {
  InvalidToken = "Invalid token !",
  TokenExpired = "Token expired !",
}

export interface AuthResponseType {
  message: string
}

export interface AuthConfirmAcountResponseType extends AuthResponseType {
  email: string
}

export interface AuthLoginResponseType extends AuthResponseType {
  loggedIn: boolean
}

export type LoginDto = Pick<User, "email" | "password">

export type CacheSessionData = {
  token: SessionToken
  user: SerializedUser
}
