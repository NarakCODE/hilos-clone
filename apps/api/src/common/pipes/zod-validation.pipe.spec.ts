import type { ArgumentMetadata } from "@nestjs/common";
import { signupRequestSchema } from "@acw/shared";
import { z } from "zod";
import { ValidationError } from "../errors/domain-errors";
import { ZodValidationPipe, zodPipe } from "./zod-validation.pipe";

const META: ArgumentMetadata = { type: "body" };

describe("ZodValidationPipe", () => {
  it("returns the parsed value for valid input", () => {
    const pipe = new ZodValidationPipe(signupRequestSchema);
    const input = { email: "user@example.com", password: "password123" };
    expect(pipe.transform(input, META)).toEqual(input);
  });

  it("applies Zod coercion/defaults from the shared schema", () => {
    const schema = z.object({ limit: z.coerce.number().default(10) });
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ limit: "25" }, META)).toEqual({ limit: 25 });
    expect(pipe.transform({}, META)).toEqual({ limit: 10 });
  });

  it("throws a ValidationError (400) with field detail on invalid input", () => {
    const pipe = new ZodValidationPipe(signupRequestSchema);
    try {
      pipe.transform({ email: "not-an-email", password: "short" }, META);
      fail("expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const ve = error as ValidationError;
      expect(ve.status).toBe(400);
      expect(ve.code).toBe("VALIDATION_ERROR");
      expect(ve.fields).toHaveProperty("email");
      expect(ve.fields).toHaveProperty("password");
    }
  });

  it("zodPipe() is a convenience constructor", () => {
    const pipe = zodPipe(signupRequestSchema);
    expect(pipe).toBeInstanceOf(ZodValidationPipe);
  });
});
