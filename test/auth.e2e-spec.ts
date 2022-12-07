import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { AppModule } from "../src/app/app.module"
import { CreateUserDto, SerializedUser } from "../src/user/types"
import { AuthError } from "../src/auth/types"
import { PrismaService } from "../src/database/prisma.service"

const AUTH_URL = `http://localhost:3000/auth`

const CREATE_USER: CreateUserDto = {
  email: "test@gmail.com",
  password: "password",
  firstName: "givenName",
  lastName: "familyName",
}

const VALID_CREATE_USER: CreateUserDto = {
  email: "test@test.com",
  password: "Bonjour1234!",
  firstName: "givenName",
  lastName: "familyName",
}

const MISSING_EMAIL_CREATE_USER = {
  ...CREATE_USER,
  email: "",
}

const MISSING_PASSWORD_CREATE_USER = {
  ...CREATE_USER,
  password: "",
}

const MISSING_FIRST_NAME_CREATE_USER = {
  ...CREATE_USER,
  firstName: "",
}

const MISSING_LAST_NAME_CREATE_USER = {
  ...CREATE_USER,
  lastName: "",
}

describe("AuthController (e2e)", () => {
  let app: INestApplication
  let prismaService: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prismaService = app.get<PrismaService>(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await prismaService.user.delete({
      where: { email: VALID_CREATE_USER.email },
    })
    await prismaService.$disconnect()
    await app.close()
  })

  describe("POST /register", () => {
    describe("Register validation pipe", () => {
      it("should NOT register a user if email is missing", () => {
        return request(AUTH_URL)
          .post("/register")
          .set("Accept", "application/json")
          .send(MISSING_EMAIL_CREATE_USER)
          .expect((response) => {
            expect(response.body).toHaveProperty("error")
            expect(response.body).toHaveProperty("message")
            expect(response.body.error).toBe("BadRequestException")
            expect(response.body.message).toEqual(AuthError.EmailRequired)
            expect(response.statusCode).toEqual(400)
          })
      })

      it("should NOT register a user if password is missing", () => {
        return request(AUTH_URL)
          .post("/register")
          .set("Accept", "application/json")
          .send(MISSING_PASSWORD_CREATE_USER)
          .expect((response) => {
            expect(response.body).toHaveProperty("error")
            expect(response.body).toHaveProperty("message")
            expect(response.body.error).toBe("BadRequestException")
            expect(response.body.message).toEqual(AuthError.PasswordRequired)
            expect(response.statusCode).toEqual(400)
          })
      })

      it("should NOT register a user if first name is missing", () => {
        return request(AUTH_URL)
          .post("/register")
          .set("Accept", "application/json")
          .send(MISSING_FIRST_NAME_CREATE_USER)
          .expect((response) => {
            expect(response.body).toHaveProperty("error")
            expect(response.body).toHaveProperty("message")
            expect(response.body.error).toBe("BadRequestException")
            expect(response.body.message).toEqual(AuthError.FirstNameRequired)
            expect(response.statusCode).toEqual(400)
          })
      })

      it("should NOT register a user if last name is missing", () => {
        return request(AUTH_URL)
          .post("/register")
          .set("Accept", "application/json")
          .send(MISSING_LAST_NAME_CREATE_USER)
          .expect((response) => {
            expect(response.body).toHaveProperty("error")
            expect(response.body).toHaveProperty("message")
            expect(response.body.error).toBe("BadRequestException")
            expect(response.body.message).toEqual(AuthError.LastNameRequired)
            expect(response.statusCode).toEqual(400)
          })
      })
    })

    it("should register a user", () => {
      return request(AUTH_URL)
        .post("/register")
        .set("Accept", "application/json")
        .send(VALID_CREATE_USER)
        .expect((response) => {
          Object.keys(SerializedUser).forEach((key) => {
            console.log(key)
            expect(response.body).toHaveProperty(key)
          })
          expect(response.body.email).toEqual(VALID_CREATE_USER.email)
          expect(response.body.firstName).toEqual(VALID_CREATE_USER.firstName)
          expect(response.body.lastName).toEqual(VALID_CREATE_USER.lastName)
          expect(response.body.password).toEqual(null)
          expect(response.statusCode).toEqual(201)
        })
    })
  })
})
