/**
 * Domain exception classes for the AI Collaboration Workspace API.
 *
 * Service and controller code throws these typed errors; the
 * {@link GlobalExceptionFilter} maps each to an HTTP status and the shared
 * response envelope `{ error: { code, message, fields? } }`
 * (see design.md "Error Handling").
 *
 * Status mapping (design.md "REST Conventions" / "Error Handling"):
 *   - ValidationError       -> 400  (invalid input; populates `fields`)
 *   - UnauthenticatedError  -> 401  (no / invalid session)        (Req 1.10)
 *   - AuthorizationError    -> 403  (authenticated but not permitted)
 *   - NotFoundError         -> 404  (entity does not exist / not visible)
 *   - ConflictError         -> 409  (duplicate / unique-constraint conflict)
 *   - StateGuardError       -> 422  (request valid but disallowed by state)
 */

/** Per-field validation messages, keyed by the (dot-pathed) field name. */
export type FieldErrors = Record<string, string[]>;

/**
 * Base class for all domain errors. Carries a stable machine-readable `code`,
 * the HTTP `status` the filter should emit, and optional field-level detail.
 */
export abstract class DomainError extends Error {
  /** Stable, machine-readable error code (SCREAMING_SNAKE_CASE). */
  abstract readonly code: string;
  /** HTTP status code the exception filter maps this error to. */
  abstract readonly status: number;
  /** Optional field-level validation detail (used by 400 responses). */
  readonly fields?: FieldErrors;

  protected constructor(message: string, fields?: FieldErrors) {
    super(message);
    this.name = new.target.name;
    if (fields) {
      this.fields = fields;
    }
    // Restore the prototype chain for `instanceof` across transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 - input failed validation (Req 1.2, 2.2, 3.2, 4.2, 4.6, 5.10). */
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;

  constructor(message = "Validation failed", fields?: FieldErrors) {
    super(message, fields);
  }
}

/** 401 - request is not authenticated (Req 1.10). */
export class UnauthenticatedError extends DomainError {
  readonly code = "UNAUTHENTICATED";
  readonly status = 401;

  constructor(message = "Authentication required") {
    super(message);
  }
}

/** 403 - authenticated but not permitted to perform the action. */
export class AuthorizationError extends DomainError {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "You do not have permission to perform this action") {
    super(message);
  }
}

/** 404 - the requested entity does not exist or is not visible to the caller. */
export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly status = 404;

  constructor(message = "Resource not found") {
    super(message);
  }
}

/** 409 - the request conflicts with existing state (duplicate / uniqueness). */
export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
  readonly status = 409;

  constructor(message = "Request conflicts with existing state") {
    super(message);
  }
}

/**
 * 422 - the request is well-formed but disallowed by the current state of the
 * target resource (e.g. archived-room send, last-Owner guard, non-cancellable
 * run state). Distinct from {@link ConflictError} so state-guard violations can
 * be surfaced separately from uniqueness conflicts when desired.
 */
export class StateGuardError extends DomainError {
  readonly code = "UNPROCESSABLE_STATE";
  readonly status = 422;

  constructor(message = "Request is not allowed in the current state") {
    super(message);
  }
}
