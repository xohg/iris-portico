/**
 * Client error types for the SysAdmin API.
 */

/** Base error for any failed API call. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors: string[];
  /** True when the server rejected the call due to a missing privilege. */
  public readonly forbidden: boolean;
  /** The raw HTTP status (401/403/404/...). */
  public readonly httpStatus: number;

  constructor(opts: {
    message: string;
    status?: number;
    code?: string;
    errors?: string[];
    httpStatus?: number;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status ?? 0;
    this.code = opts.code ?? '';
    this.errors = opts.errors ?? [];
    this.httpStatus = opts.httpStatus ?? 0;
    this.forbidden = this.httpStatus === 403;
  }
}

/** Thrown when the caller lacks the required %Admin_* privilege (HTTP 403). */
export class PrivilegeError extends ApiError {
  constructor(opts: { message: string; code?: string; errors?: string[]; httpStatus?: number }) {
    super({ ...opts, httpStatus: 403 });
    this.name = 'PrivilegeError';
  }
}

/** Thrown on HTTP 401 (bad/missing credentials). */
export class AuthError extends ApiError {
  constructor(opts: { message: string; code?: string; errors?: string[] }) {
    super({ ...opts, httpStatus: 401 });
    this.name = 'AuthError';
  }
}

/** Thrown when the resource was not found (HTTP 404). */
export class NotFoundError extends ApiError {
  constructor(opts: { message: string; code?: string; errors?: string[] }) {
    super({ ...opts, httpStatus: 404 });
    this.name = 'NotFoundError';
  }
}

/** Thrown when the request is malformed (HTTP 400). */
export class BadRequestError extends ApiError {
  constructor(opts: { message: string; code?: string; errors?: string[] }) {
    super({ ...opts, httpStatus: 400 });
    this.name = 'BadRequestError';
  }
}

/** A task that cannot be paused/resumed/canceled (HTTP 409). */
export class ConflictError extends ApiError {
  constructor(opts: { message: string; code?: string; errors?: string[] }) {
    super({ ...opts, httpStatus: 409 });
    this.name = 'ConflictError';
  }
}
