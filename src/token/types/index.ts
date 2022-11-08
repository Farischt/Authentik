import {
  AccountConfirmationToken,
  PasswordResetToken,
  SessionToken,
} from "@prisma/client"

import { SerializedUser } from "../../user/types"

export type SessionTokenWithoutUserPassword = SessionToken & {
  user: SerializedUser | undefined
}

export type Token = SessionToken | AccountConfirmationToken | PasswordResetToken

export type TokenWithoutUserPassword = Token & {
  user: SerializedUser | undefined
}
