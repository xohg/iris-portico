import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminService } from './admin.service';
import type { Info } from '@iris-portico/api-client';

/**
 * Authentication + session state.
 *
 * - login() authenticates against /api/admin (JWT, with basic fallback)
 * - persists the token in localStorage so refreshes keep the session
 * - exposes the logged-in Info (incl. held privileges) for the UI
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _authed = new BehaviorSubject<boolean>(false);
  private readonly _info = new BehaviorSubject<Info | null>(null);

  readonly authed$: Observable<boolean> = this._authed.asObservable();
  readonly info$: Observable<Info | null> = this._info.asObservable();

  constructor(private readonly admin: AdminService) {
    const router = inject(Router);

    // When the session is LOST (a refresh failure, or logout) while the user is
    // on an authenticated page, send them to the sign-in page. Without this the
    // user would be stranded on a page full of 401 errors (the guard only runs
    // on navigation, so it can't react to a mid-page token death). Only react
    // to an authenticated → unauthenticated transition, not the initial false.
    let wasAuthed = false;
    this._authed.subscribe((authed) => {
      if (wasAuthed && !authed && !router.url.startsWith('/login')) {
        router.navigate(['/login']);
      }
      wasAuthed = authed;
    });

    // Keep localStorage in sync whenever the tokens change (login, refresh,
    // basic-auth fallback, logout). After a refresh the refresh token may be
    // rotated, so the new one must be persisted or the next page load loses it.
    this.admin.client.auth.onTokensChanged = (state) => {
      const authed = state.accessToken !== undefined || state.refreshToken !== undefined || !!state.basic;
      if (authed) {
        this.persistState();
        this._authed.next(true);
      } else {
        // Tokens were cleared (logout, or an unrecoverable refresh failure):
        // drop the persisted session and mark the UI as signed out so the
        // guard can redirect to /login.
        this.clearPersisted();
        this._authed.next(false);
        this._info.next(null);
      }
    };

    // Restore a persisted session on boot (JWT or Basic auth).
    //
    // The WHOLE state is restored — including the refresh token. Restoring only
    // the access token would leave the session unrefreshable: once the access
    // token's 60 s TTL elapses, the next 401 cannot be recovered (no refresh
    // token) and the app would sit in a permanent "authenticated but 401" state.
    const s = this.readState();
    if (s) {
      this.admin.client.auth.restore(s);
      if (this.admin.client.auth.isAuthenticated) {
        this._authed.next(true);
        // A full-page reload restores the session but /info (and therefore the
        // held-privilege list) has not been fetched yet. Fetch it now so the
        // permission gates (live getters) reflect the real privileges instead of
        // staying empty until the next manual navigation.
        this.refreshInfo().catch(() => { /* offline / token invalid — the 401 retry handles it */ });
      }
    }
  }

  get isAuthenticated(): boolean {
    return this.admin.client.auth.isAuthenticated;
  }

  /** Authenticate. Tries JWT first; falls back to basic auth on 401. */
  async login(user: string, password: string, role?: string): Promise<Info> {
    try {
      await this.admin.client.auth.login(user, password, role);
    } catch {
      // Fallback for pre-2026.2 instances without /login.
      this.admin.client.auth.setBasicAuth(user, password);
    }
    this.persistState();
    const info = await this.admin.client.getInfo();
    this._info.next(info);
    this._authed.next(true);
    return info;
  }

  async logout(): Promise<void> {
    try {
      await this.admin.client.auth.logout();
    } catch {
      this.admin.client.auth.clear();
    }
    this._authed.next(false);
    this._info.next(null);
    this.clearPersisted();
  }

  /** Re-fetch /info (e.g. to refresh the privilege list). */
  async refreshInfo(): Promise<Info> {
    const info = await this.admin.client.getInfo();
    this._info.next(info);
    return info;
  }

  /** Persist the full auth state (JWT or Basic) so refreshes keep the session. */
  private persistState(): void {
    try { localStorage.setItem('portico.auth', JSON.stringify(this.admin.client.auth.state)); } catch { /* ignore */ }
  }

  /** Drop the persisted session (logout / unrecoverable refresh failure). */
  private clearPersisted(): void {
    try { localStorage.removeItem('portico.auth'); } catch { /* ignore */ }
  }

  private readState(): { accessToken?: string; basic?: boolean; basicPassword?: string; username?: string } | null {
    try {
      const raw = localStorage.getItem('portico.auth');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
