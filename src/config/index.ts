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

export type BaseConfig = {
  PORT: number
  DATABASE: DatabaseConfig
  REDIS: RedisConfig
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
})
