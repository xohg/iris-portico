import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import type { Info } from '@iris-portico/api-client';

/**
 * Permission gating.
 *
 * The SysAdmin API gates every operation on a %Admin_* privilege. /info returns
 * the privileges the logged-in user holds — as an object keyed by the short
 * privilege name (e.g. `Manage`, `Operate`, `OAuth2_Client`), each `{ use }`.
 * This service maps those to full `%Admin_*` names and lets the UI show/hide
 * (or disable) actions the user is not allowed to perform.
 */
export const PRIV = {
  MANAGE: '%Admin_Manage',
  OPERATE: '%Admin_Operate',
  SECURE: '%Admin_Secure',
  TASK: '%Admin_Task',
  WALLET: '%Admin_Wallet',
  JOURNAL: '%Admin_Journal',
  OAUTH2_CLIENT: '%Admin_OAuth2_Client',
  OAUTH2_SERVER: '%Admin_OAuth2_Server',
  OAUTH2_REGISTRATION: '%Admin_OAuth2_Registration',
  EXT_LANG_EDIT: '%Admin_ExternalLanguageServerEdit',
  FS_ACCESS: '%Admin_FileSystemAccess',
  CONFIG_STORE: '%Admin_ConfigStore',
} as const;

/** Info.privileges is an object: { Manage: { use }, Operate: { use }, ... }. */
function extractHeld(privileges: Info['privileges']): string[] {
  if (!privileges) return [];
  return Object.entries(privileges)
    .filter(([, v]) => (v as { use?: boolean }).use)
    .map(([key]) => `%Admin_${key}`);
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private held: string[] = [];

  constructor(private readonly auth: AuthService) {
    this.auth.info$.subscribe((info: Info | null) => {
      this.held = extractHeld(info?.privileges);
    });
  }

  /** Does the current user hold any of the given privileges? */
  can(...privs: string[]): boolean {
    if (privs.length === 0) return true;
    return privs.some((p) => this.held.includes(p));
  }

  get heldPrivileges(): string[] {
    return [...this.held];
  }
}
