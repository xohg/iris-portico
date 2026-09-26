/**
 * Authentication state + flows for the SysAdmin API.
 *
 * Supports two modes:
 *  - JWT (IRIS 2026.2+): POST /login → access_token + refresh_token
 *  - Basic (any version): username/password per request
 *
 * The manager is transport-agnostic: it receives a low-level `call` function so
 * it can be reused by any AdminClient instance.
 */
export type CallFn = (method: string, path: string, opts?: { body?: unknown; auth?: boolean }) => Promise<any>;

export interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  /** When true, requests use Basic auth (username/password) instead of a JWT. */
  basic?: boolean;
  basicPassword?: string;
}

export class AuthManager {
  private _state: AuthState = {};
  /** In-flight refresh (single-flight: concurrent 401s share one /refresh call). */
  private _refreshing: Promise<AuthState> | null = null;
  /** Optional hook invoked after a successful refresh (e.g. to persist the token). */
  public onTokensChanged?: (state: AuthState) => void;

  constructor(private readonly call: CallFn) {}

  get state(): AuthState {
    return { ...this._state };
  }

  get isAuthenticated(): boolean {
    return !!this._state.accessToken || !!this._state.basic;
  }

  /**
   * Restore a previously persisted state — including the refresh token.
   * (Restoring only the access token would make the session unrefreshable
   * after the access token's 60 s TTL, turning the next 401 into a
   * permanent, unrecoverable failure.)
   */
  restore(s: AuthState): void {
    if (s.accessToken || s.refreshToken || s.basic) {
      this._state = { ...s };
      this.notify();
    }
  }

  /**
   * Authenticate via POST /login (JWT).
   *
   * NOTE: the 2026.2 implementation returns a BARE OAuth2-style response
   * ({ access_token, refresh_token, sub, iat, exp }) — NOT the BaseResponse
   * envelope the spec's LoginResponse schema implies. Accept both shapes.
   */
  async login(user: string, password: string, role?: string): Promise<AuthState> {
    const res = await this.call('POST', '/login', {
      body: { user, password, ...(role ? { role } : {}) },
      auth: false,
    });
    const payload = this.unwrapTokens(res);
    this._state = {
      accessToken: payload?.access_token,
      refreshToken: payload?.refresh_token,
      username: payload?.sub ?? user,
    };
    if (!this._state.accessToken) {
      throw new Error('Login response did not contain an access token');
    }
    this.notify();
    return this.state;
  }

  /** Use Basic auth (for instances before 2026.2, or as a fallback). */
  setBasicAuth(user: string, password: string): void {
    this._state = { basic: true, basicPassword: password, username: user };
    this.notify();
  }

  /** Set an externally-obtained access token. */
  setToken(token: string): void {
    this._state = { ...this._state, accessToken: token };
    this.notify();
  }

  /**
   * Refresh the access token using the stored refresh token.
   *
   * Single-flight: when the access token expires, every in-flight request
   * 401s at once and each would call refresh() — so concurrent callers share
   * one /refresh round-trip (a rotated/one-shot refresh token would otherwise
   * be consumed by the first call and the rest would fail).
   *
   * On failure the state is cleared: the refresh token is unusable (expired,
   * rotated, or invalidated by a server restart), so the session must end —
   * staying "authenticated" with dead tokens would leave the app in a
   * permanent 401 state (the guard would never redirect to /login).
   */
  refresh(): Promise<AuthState> {
    if (!this._refreshing) {
      this._refreshing = this.doRefresh().finally(() => {
        this._refreshing = null;
      });
    }
    return this._refreshing;
  }

  private async doRefresh(): Promise<AuthState> {
    if (!this._state.refreshToken) throw new Error('No refresh token available');
    try {
      const res = await this.call('POST', '/refresh', {
        body: { refresh_token: this._state.refreshToken },
        auth: false,
      });
      const payload = this.unwrapTokens(res);
      this._state = {
        ...this._state,
        accessToken: payload?.access_token ?? this._state.accessToken,
        refreshToken: payload?.refresh_token ?? this._state.refreshToken,
      };
      this.notify();
      return this.state;
    } catch (e) {
      this.clear();
      throw e;
    }
  }

  /**
   * The /login and /refresh endpoints return the token payload either bare
   * (2026.2: { access_token, ... }) or under a `result` wrapper (per spec).
   * Normalize to the bare shape.
   */
  private unwrapTokens(res: any): { access_token?: string; refresh_token?: string; sub?: string } {
    if (res && typeof res === 'object' && 'result' in res && res.result) {
      return res.result;
    }
    return res;
  }

  /** Logout and invalidate the refresh token. */
  async logout(): Promise<void> {
    try {
      await this.call('POST', '/logout', { auth: true });
    } finally {
      this.clear();
    }
  }

  /** Revoke the current access token. */
  async revoke(): Promise<void> {
    await this.call('POST', '/revoke', { auth: true });
    this.clear();
  }

  clear(): void {
    this._state = {};
    this.notify();
  }

  /** Headers to attach to authenticated requests. */
  authHeaders(): Record<string, string> {
    if (this._state.basic && this._state.basicPassword !== undefined) {
      const cred = toBase64(`${this._state.username}:${this._state.basicPassword}`);
      return { Authorization: `Basic ${cred}` };
    }
    if (this._state.accessToken) {
      return { Authorization: `Bearer ${this._state.accessToken}` };
    }
    return {};
  }

  private notify(): void {
    if (this.onTokensChanged) this.onTokensChanged(this.state);
  }
}

/**
 * Cross-platform base64 encoding.
 *
 * `Buffer` is a Node.js global and does NOT exist in the browser, so the
 * Basic-auth header must be built with `btoa` there. `btoa` only accepts
 * Latin-1, so UTF-8 is percent-encoded first (the standard browser idiom).
 */
function toBase64(s: string): string {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(s)));
  }
  // Node.js (tests / BFF).
  return Buffer.from(s).toString('base64');
}
