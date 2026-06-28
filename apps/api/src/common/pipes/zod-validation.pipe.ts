import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../errors/domain-errors";
import { zodErrorToFields } from "../filters/global-exception.filter";

/**
 * Validates a request payload (body, query, or params) against a shared Zod
 * schema from `@acw/shared`.
 *
 * On success it returns the parsed value (Zod coercions/defaults applied). On
 * failure it throws a {@link ValidationError} (HTTP 400) whose `fields` carry
 * per-field messages, which the {@link GlobalExceptionFilter} renders as
 * `{ error: { code: "VALIDATION_ERROR", message, fields } }`
 * (design.md "Error Handling": invalid input returns 400 and persists nothing).
 *
 * Usage:
 * ```ts
 * @Post()
 * create(@Body(new ZodValidationPipe(signupRequestSchema)) dto: SignupRequest) {}
 * ```
 */
@Injectable()
export class ZodValidationPipe<TSchema extends ZodType>
  implements PipeTransform
{
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Validation failed", zodErrorToFields(error));
      }
      throw error;
    }
  }
}

/**
 * Factory helper for readability at call sites:
 * `@Body(zodBody(signupRequestSchema))`.
 */
export function zodPipe<TSchema extends ZodType>(
  schema: TSchema,
): ZodValidationPipe<TSchema> {
  return new ZodValidationPipe(schema);
}
