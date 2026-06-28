import { ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { z } from "zod";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  StateGuardError,
  UnauthenticatedError,
  ValidationError,
} from "../errors/domain-errors";
import {
  ErrorResponseBody,
  GlobalExceptionFilter,
  zodErrorToFields,
} from "./global-exception.filter";

interface CapturedResponse {
  statusCode?: number;
  body?: ErrorResponseBody;
}

function makeHost(captured: CapturedResponse): ArgumentsHost {
  const res = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(body: ErrorResponseBody) {
      captured.body = body;
      return this;
    },
  };
  const req = { method: "GET", url: "/test" };
  return {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  } as unknown as ArgumentsHost;
}

describe("GlobalExceptionFilter", () => {
  const filter = new GlobalExceptionFilter();

  function run(exception: unknown): CapturedResponse {
    const captured: CapturedResponse = {};
    filter.catch(exception, makeHost(captured));
    return captured;
  }

  it.each([
    [new ValidationError("bad"), 400, "VALIDATION_ERROR"],
    [new UnauthenticatedError(), 401, "UNAUTHENTICATED"],
    [new AuthorizationError(), 403, "FORBIDDEN"],
    [new NotFoundError(), 404, "NOT_FOUND"],
    [new ConflictError(), 409, "CONFLICT"],
    [new StateGuardError(), 422, "UNPROCESSABLE_STATE"],
  ])(
    "maps %s to status %i with code %s",
    (error, status, code) => {
      const { statusCode, body } = run(error);
      expect(statusCode).toBe(status);
      expect(body?.error.code).toBe(code);
      expect(typeof body?.error.message).toBe("string");
    },
  );

  it("includes field-level detail for validation errors", () => {
    const error = new ValidationError("Validation failed", {
      email: ["Invalid email"],
    });
    const { statusCode, body } = run(error);
    expect(statusCode).toBe(400);
    expect(body?.error.fields).toEqual({ email: ["Invalid email"] });
  });

  it("does not attach a fields key when there is no field detail", () => {
    const { body } = run(new NotFoundError());
    expect(body?.error).not.toHaveProperty("fields");
  });

  it("maps a raw ZodError to a 400 validation envelope", () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    const { statusCode, body } = run(result.success ? null : result.error);
    expect(statusCode).toBe(400);
    expect(body?.error.code).toBe("VALIDATION_ERROR");
    expect(body?.error.fields).toHaveProperty("name");
  });

  it("maps a Nest HttpException to its status and derived code", () => {
    const { statusCode, body } = run(
      new HttpException("nope", HttpStatus.FORBIDDEN),
    );
    expect(statusCode).toBe(403);
    expect(body?.error.code).toBe("FORBIDDEN");
    expect(body?.error.message).toBe("nope");
  });

  it("maps an unknown error to a 500 without leaking details", () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const { statusCode, body } = run(new Error("secret stack detail"));
    expect(statusCode).toBe(500);
    expect(body?.error.code).toBe("INTERNAL_ERROR");
    expect(body?.error.message).toBe("An unexpected error occurred");
    errorSpy.mockRestore();
  });

  it("groups Zod issues by dot-pathed field name", () => {
    const schema = z.object({ profile: z.object({ age: z.number() }) });
    const result = schema.safeParse({ profile: { age: "x" } });
    const fields = zodErrorToFields(
      result.success ? new z.ZodError([]) : result.error,
    );
    expect(Object.keys(fields)).toContain("profile.age");
  });
});
