/**
 * AdminClient — the framework-agnostic client for the IRIS SysAdmin API.
 *
 * Responsibilities:
 *  - transport (injectable fetch)
 *  - authentication (JWT / basic) via AuthManager
 *  - BaseResponse envelope unwrapping (returns `result`)
 *  - typed error mapping (401/403/404/400/409/5xx)
 *  - optional auto-refresh + single retry on 401
 *
 * The 6 task-area typed helpers live in `domains.ts` and are attached as
 * `client.domains`.
 */
import type { FetchLike } from './http';
import { buildUrl, request as doRequest } from './http';
import { AuthManager } from './auth';
import {
  ApiError,
  AuthError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  PrivilegeError,
} from './errors';
import type { Info } from '../types';
import { createDomains, type Domains } from './domains';

export interface ClientConfig {
  /** Base URL of the SysAdmin API. Defaults to "/api/admin" (same origin). */
  baseUrl?: string;
  /** Injectable fetch (defaults to global fetch). */
  fetch?: FetchLike;
  /** When true, a 401 triggers a token refresh + single retry. Default true. */
  autoRefresh?: boolean;
  /** Called before each request; can return extra headers. */
  onRequest?: (method: string, path: string) => Record<string, string> | undefined;
}

type Query = Record<string, unknown>;

export class AdminClient {
  public readonly config: Required<Pick<ClientConfig, 'baseUrl' | 'autoRefresh'>> & ClientConfig;
  public readonly auth: AuthManager;
  public readonly domains: Domains;

  constructor(config: ClientConfig = {}) {
    const fetchImpl: FetchLike =
      config.fetch ??
      ((url, init) => (globalThis as any).fetch(url, init as RequestInit));
    this.config = {
      baseUrl: config.baseUrl ?? '/api/admin',
      autoRefresh: config.autoRefresh ?? true,
      fetch: fetchImpl,
      onRequest: config.onRequest,
    };
    this.auth = new AuthManager((method, path, opts) =>
      this.callRaw(method, path, opts),
    );
    this.domains = createDomains(this);
  }

  // ------------------------------------------------------------------
  // Core
  // ------------------------------------------------------------------

  /** Low-level call (no envelope unwrap, no error mapping). Used by AuthManager. */
  async callRaw(
    method: string,
    path: string,
    opts: { body?: unknown; auth?: boolean; query?: Query } = {},
  ): Promise<any> {
    const useAuth = opts.auth !== false;
    const headers: Record<string, string> = {};
    if (useAuth) Object.assign(headers, this.auth.authHeaders());
    if (this.config.onRequest) Object.assign(headers, this.config.onRequest(method, path) || {});
    const url = buildUrl(this.config.baseUrl, path, opts.query);
    const { status, data } = await doRequest(this.config.fetch!, method, url, {
      headers,
      body: opts.body,
    });
    if (status >= 400) {
      throw this.mapError(status, data);
    }
    return data;
  }

  /** Typed call: unwraps the BaseResponse envelope and returns `result`. */
  async call<T = unknown>(
    method: string,
    path: string,
    opts: { body?: unknown; query?: Query; auth?: boolean } = {},
  ): Promise<T> {
    try {
      const data = await this.callRaw(method, path, opts);
      // Envelope: { status, console, result } → return result (or the whole body
      // for endpoints like /login which put the payload under `result` too).
      if (data && typeof data === 'object' && 'result' in data) {
        return (data.result as T) ?? (data as T);
      }
      return data as T;
    } catch (e) {
      // Auto-refresh + single retry on 401.
      //
      // Only retry calls that actually sent an auth header. The login/refresh
      // endpoints are called with `auth: false` (no header), so a 401 from them
      // is a real credential failure and must NOT trigger a refresh+retry loop.
      if (
        this.config.autoRefresh &&
        e instanceof AuthError &&
        this.auth.state.refreshToken &&
        opts.auth !== false
      ) {
        await this.auth.refresh();
        const data = await this.callRaw(method, path, opts);
        if (data && typeof data === 'object' && 'result' in data) {
          return (data.result as T) ?? (data as T);
        }
        return data as T;
      }
      throw e;
    }
  }

  // Convenience verbs
  get<T = unknown>(path: string, query?: Query): Promise<T> {
    return this.call<T>('GET', path, { query });
  }
  post<T = unknown>(path: string, body?: unknown, query?: Query): Promise<T> {
    return this.call<T>('POST', path, { body, query });
  }
  put<T = unknown>(path: string, body?: unknown, query?: Query): Promise<T> {
    return this.call<T>('PUT', path, { body, query });
  }
  del<T = unknown>(path: string, query?: Query): Promise<T> {
    return this.call<T>('DELETE', path, { query });
  }
  head<T = unknown>(path: string, query?: Query): Promise<T> {
    return this.call<T>('HEAD', path, { query });
  }

  /** GET /info — server, API, and logged-in user (incl. held privileges). */
  getInfo(): Promise<Info> {
    return this.call<Info>('GET', '/info');
  }

  /**
   * A POST that resolves with the async task id from the `202 + Location`
   * response (the long-running-operations pattern), so the caller can poll
   * `GET /v2/async-result?id=...`. `taskId` is null when the response was not
   * async (no Location header).
   */
  async postAsync(
    path: string,
    body?: unknown,
    query?: Query,
  ): Promise<{ taskId: string | null; data: any }> {
    const headers: Record<string, string> = {};
    Object.assign(headers, this.auth.authHeaders());
    const url = buildUrl(this.config.baseUrl, path, query);
    const { status, data, location } = await doRequest(this.config.fetch!, 'POST', url, {
      headers,
      body,
    });
    if (status >= 400) {
      throw this.mapError(status, data);
    }
    let taskId: string | null = null;
    if (location) {
      const m = location.match(/[?&]id=([^&]+)/);
      if (m) taskId = decodeURIComponent(m[1]);
    }
    return { taskId, data };
  }

  // ------------------------------------------------------------------
  // Error mapping
  // ------------------------------------------------------------------
  private mapError(status: number, data: any): ApiError {
    const summary: string = data?.status?.summary ?? '';
    const errors: string[] = data?.status?.Errors ?? [];
    const message = summary || errors.join('; ') || `HTTP ${status}`;
    switch (status) {
      case 400:
        return new BadRequestError({ message, errors });
      case 401:
        return new AuthError({ message, errors });
      case 403:
        return new PrivilegeError({ message, errors });
      case 404:
        return new NotFoundError({ message, errors });
      case 409:
        return new ConflictError({ message, errors });
      default:
        return new ApiError({ message, status, errors, httpStatus: status });
    }
  }
}
