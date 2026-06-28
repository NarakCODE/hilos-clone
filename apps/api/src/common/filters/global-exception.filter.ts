import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  DomainError,
  type FieldErrors,
} from "../errors/domain-errors";

/**
 * Shape of every error response emitted by the API.
 *
 * design.md "Error Handling": a global exception filter maps domain errors to
 * the consistent envelope `{ error: { code, message, fields? } }`.
 */
export interface ErrorResponseBody {
  error: {
    /** Stable machine-readable code (e.g. `VALIDATION_ERROR`, `NOT_FOUND`). */
    code: string;
    /** Human-readable message. Auth failures stay intentionally generic. */
    message: string;
    /** Field-level detail for validation (400) responses. */
    fields?: FieldErrors;
  };
}

/** Map an HTTP status code to a stable, machine-readable error code. */
function codeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "VALIDATION_ERROR";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHENTICATED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "UNPROCESSABLE_STATE";
    default:
      return "INTERNAL_ERROR";
  }
}

/**
 * Convert a {@link ZodError} into field-level messages keyed by dot-path.
 * `_root` collects issues that are not attributable to a specific field.
 */
export function zodErrorToFields(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

/**
 * Catch-all exception filter. Resolves four error families into the shared
 * `{ error: { code, message, fields? } }` envelope with the correct HTTP
 * status:
 *
 *   1. {@link DomainError}  -> declared `status` / `code` (+ `fields`)
 *   2. {@link ZodError}     -> 400 with field-level detail
 *   3. {@link HttpException} (Nest built-ins / guards) -> its status
 *   4. anything else        -> 500 INTERNAL_ERROR (details not leaked)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled error on ${request?.method} ${request?.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    body: ErrorResponseBody;
  } {
    // 1. Domain errors carry their own status, code, and optional fields.
    if (exception instanceof DomainError) {
      return {
        status: exception.status,
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            ...(exception.fields ? { fields: exception.fields } : {}),
          },
        },
      };
    }

    // 2. Zod errors thrown outside the validation pipe -> 400 validation.
    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            fields: zodErrorToFields(exception),
          },
        },
      };
    }

    // 3. Nest HttpException (built-in guards, pipes, manual throws).
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === "string"
          ? payload
          : ((payload as { message?: string | string[] })?.message ??
            exception.message);

      return {
        status,
        body: {
          error: {
            code: codeForStatus(status),
            message: Array.isArray(message) ? message.join(", ") : message,
          },
        },
      };
    }

    // 4. Unknown error -> 500, do not leak internal details.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
    };
  }
}
