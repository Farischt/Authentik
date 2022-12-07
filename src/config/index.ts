import * as config from "./config.json"

export type RedisConfig = {
  HOST: string
  PORT: number
  USERNAME: string
  PASSWORD: string
}

export type DatabaseConfig = {
  URL: string
}

export type AuthConfig = {
  SALT_ROUNDS: number
  TOKEN_TTL_IN_SECONDS: number
  TOKEN_TTL_IN_MS: number
}

export type MailConfig = {
  ENABLE: boolean
  HOST: string
  USER: string
  PASSWORD: string
  FROM: string
}

export type FrontAppConfig = {
  URL: string
}

export type BaseConfig = {
  PORT: number
  DATABASE: DatabaseConfig
  REDIS: RedisConfig
  AUTH: AuthConfig
  MAIL: MailConfig
  FRONT_APP: FrontAppConfig
}

export enum Configuration {
  PORT = "PORT",
  DATABASE = "DATABASE",
  DATABASE_URL = "DATABASE.URL",
  REDIS = "REDIS",
  REDIS_HOST = "REDIS.HOST",
  REDIS_PORT = "REDIS.PORT",
  REDIS_USERNAME = "REDIS.USERNAME",
  REDIS_PASSWORD = "REDIS.PASSWORD",
  AUTH = "AUTH",
  AUTH_SALT_ROUNDS = "AUTH.SALT_ROUNDS",
  AUTH_TOKEN_TTL_IN_SECONDS = "AUTH.TOKEN_TTL_IN_SECONDS",
  AUTH_TOKEN_TTL_IN_MS = "AUTH.TOKEN_TTL_IN_MS",
  MAIL = "MAIL",
  MAIL_ENABLE = "MAIL.ENABLE",
  MAIL_FROM = "MAIL.FROM",
  MAIL_HOST = "MAIL.HOST",
  MAIL_USER = "MAIL.USER",
  MAIL_PASSWORD = "MAIL.PASSWORD",
  FRONT_APP = "FRONT_APP",
  FRONT_APP_URL = "FRONT_APP.URL",
}

const env = process.env.NODE_ENV || "development"

export default (): BaseConfig => ({
  PORT: parseInt(config[env].APP_PORT, 10),
  DATABASE: {
    URL: config[env].DATABASE_URL,
  },
  REDIS: {
    HOST: config[env].REDIS_HOST,
    PORT: parseInt(config[env].REDIS_PORT, 10),
    USERNAME: config[env].REDIS_USERNAME,
    PASSWORD: config[env].REDIS_PASSWORD,
  },
  AUTH: {
    SALT_ROUNDS: parseInt(config[env].SALT_ROUNDS, 10),
    TOKEN_TTL_IN_SECONDS: parseInt(config[env].TOKEN_TTL_IN_SECONDS, 10),
    TOKEN_TTL_IN_MS: parseInt(config[env].TOKEN_TTL_IN_MS, 10),
  },
  MAIL: {
    ENABLE: config[env].ENABLE_MAIL,
    HOST: config[env].MAIL_HOST,
    USER: config[env].MAIL_USER,
    PASSWORD: config[env].MAIL_PASSWORD,
    FROM: config[env].MAIL_FROM,
  },
  FRONT_APP: {
    URL: config[env].FRONT_APP_URL,
  },
})
