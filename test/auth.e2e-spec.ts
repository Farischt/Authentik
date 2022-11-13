import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { AppModule } from "../src/app/app.module"
import { CreateUserDto } from "../src/user/types"
import { AuthError } from "../src/auth/types"

const AUTH_URL = `http://localhost:3000/auth`

const CREATE_USER: CreateUserDto = {
  email: "test@gmail.com",
  password: "password",
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
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
  })
})
