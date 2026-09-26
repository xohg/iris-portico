import { Injectable } from '@angular/core';
import { AdminClient, PrivilegeError, ApiError } from '@iris-portico/api-client';

/**
 * Thin Angular wrapper around the framework-agnostic AdminClient.
 *
 * The real client logic (auth, envelope unwrapping, error mapping, the 6
 * domain groups) lives in @iris-portico/api-client so it is shared by any
 * frontend variant. This service just binds it to the Angular DI graph and to
 * the browser's fetch.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  readonly client: AdminClient;

  constructor() {
    this.client = new AdminClient({
      baseUrl: '/api/admin',
      fetch: (url, init) => window.fetch(url, init as RequestInit),
    });
  }

  /** Convenience: is the current user allowed to perform a privileged action? */
  isPrivilegeError(e: unknown): boolean {
    return e instanceof PrivilegeError;
  }

  /** Human-readable message for any API error. */
  errorMessage(e: unknown): string {
    if (e instanceof ApiError) {
      return e.forbidden
        ? `Forbidden — you lack the required privilege: ${e.errors.join(', ') || 'unknown'}`
        : e.message;
    }
    return e instanceof Error ? e.message : String(e);
  }
}
