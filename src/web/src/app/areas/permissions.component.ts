import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';

/**
 * Permission Management — users, roles, resources, services, SQL privileges and
 * web authentication. List data typed loosely; rendered defensively.
 */
@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('permissions.title') }}</h2>
          <p class="muted">{{ t('permissions.subtitle') }}</p>
        </div>
      </div>
      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <div class="tabbar">
        @for (tb of tabs; track tb) {
          <button [class.active]="tab === tb" (click)="switchTab(tb)">{{ t('permissions.tabs.' + tb) }}</button>
        }
      </div>

      <!-- Users -->
      @if (tab === 'Users') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <button (click)="loadUsers()">{{ t('common.refresh') }}</button>
            @if (canSecure) { <button (click)="userDialog = true">{{ t('permissions.users.new') }}</button> }
          </div>
          <table>
            <thead><tr><th>{{ t('permissions.users.col.name') }}</th><th>{{ t('permissions.users.col.display') }}</th><th>{{ t('permissions.users.col.enabled') }}</th><th>{{ t('permissions.users.col.type') }}</th><th></th></tr></thead>
            <tbody>
              @for (u of users; track coalesce(u.Name, u.name)) {
                <tr>
                  <td class="mono">{{ coalesce(u.Name, u.name) }}</td>
                  <td>{{ coalesce(u.FullName, u.DisplayName, u.displayname) }}</td>
                  <td class="mono">{{ coalesce(u.Enabled, u.AutheEnabled, u.authe) }}</td>
                  <td class="mono">{{ coalesce(u.Type, u.type) }}</td>
                  <td>
                    @if (canSecure) {
                      <button class="ghost danger" style="padding:2px 8px" (click)="removeUser(coalesce(u.Name, u.name))">{{ t('permissions.users.delete') }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!users.length) { <p class="empty">{{ t('permissions.users.empty') }}</p> }
        </div>
      }

      <!-- Roles -->
      @if (tab === 'Roles') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <button (click)="loadRoles()">{{ t('common.refresh') }}</button>
            @if (canSecure) { <button (click)="roleDialog = true">{{ t('permissions.roles.new') }}</button> }
          </div>
          <table>
            <thead><tr><th>{{ t('permissions.roles.col.name') }}</th><th>{{ t('permissions.roles.col.description') }}</th><th></th></tr></thead>
            <tbody>
              @for (r of roles; track coalesce(r.Name, r.name)) {
                <tr>
                  <td class="mono">{{ coalesce(r.Name, r.name) }}</td>
                  <td>{{ coalesce(r.Description, r.description) }}</td>
                  <td>
                    @if (canSecure) {
                      <button class="ghost" style="padding:2px 8px" (click)="loadOwners(coalesce(r.Name, r.name))">{{ t('permissions.roles.owners') }}</button>
                      <button class="ghost danger" style="padding:2px 8px" (click)="removeRole(coalesce(r.Name, r.name))">{{ t('permissions.roles.delete') }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!roles.length) { <p class="empty">{{ t('permissions.roles.empty') }}</p> }
          @if (owners.length) {
            <h3 style="margin-top:16px">{{ t('permissions.roles.ownersTitle') }}: {{ ownerRole }}</h3>
            <div class="row">@for (o of owners; track o) { <span class="badge">{{ o }}</span> }</div>
          }
        </div>
      }

      <!-- Resources -->
      @if (tab === 'Resources') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadResources()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('permissions.resources.col.name') }}</th><th>{{ t('permissions.resources.col.type') }}</th><th>{{ t('permissions.resources.col.description') }}</th></tr></thead>
            <tbody>
              @for (r of resources; track coalesce(r.Name, r.name)) {
                <tr><td class="mono">{{ coalesce(r.Name, r.name) }}</td><td>{{ coalesce(r.ResourceType, r.Kind, r.kind) }}</td><td>{{ coalesce(r.Description, r.description) }}</td></tr>
              }
            </tbody>
          </table>
          @if (!resources.length) { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      }

      <!-- Services -->
      @if (tab === 'Services') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadServices()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('permissions.services.col.name') }}</th><th>{{ t('permissions.services.col.enabled') }}</th><th>{{ t('permissions.services.col.public') }}</th></tr></thead>
            <tbody>
              @for (s of services; track coalesce(s.Name, s.name)) {
                <tr><td class="mono">{{ coalesce(s.Name, s.name) }}</td><td><span class="badge" [class.ok]="coalesce(s.Enabled, s.state)">{{ coalesce(s.Enabled, s.State, s.state) }}</span></td><td>{{ coalesce(s.Public, s.StartState, s.startstate) }}</td></tr>
              }
            </tbody>
          </table>
          @if (!services.length) { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      }

      <!-- SQL Privileges -->
      @if (tab === 'SQL Privileges') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <input [placeholder]="t('permissions.sql.ph.grantee')" [(ngModel)]="sqlGrantee" />
            <input [placeholder]="t('permissions.sql.ph.privilege')" [(ngModel)]="sqlPriv" />
            <button (click)="loadSql()">{{ t('permissions.sql.query') }}</button>
            @if (canSecure) {
              <button (click)="grantSql()">{{ t('permissions.sql.grant') }}</button>
              <button class="danger" (click)="revokeSql()">{{ t('permissions.sql.revoke') }}</button>
            }
          </div>
          <table>
            <thead><tr><th>{{ t('permissions.sql.col.grantee') }}</th><th>{{ t('permissions.sql.col.privilege') }}</th><th>{{ t('permissions.sql.col.namespace') }}</th><th>{{ t('permissions.sql.col.action') }}</th></tr></thead>
            <tbody>
              @for (p of sqlPrivs; track $index) {
                <tr><td class="mono">{{ coalesce(p.Grantee, p.grantee) }}</td><td class="mono">{{ coalesce(p.Privilege, p.privilege) }}</td><td>{{ coalesce(p.Namespace, p.namespace) }}</td><td>{{ coalesce(p.Action, p.action) }}</td></tr>
              }
            </tbody>
          </table>
          @if (!sqlPrivs.length) { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      }

      <!-- Web Auth -->
      @if (tab === 'Web Auth') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadWebAuth()">{{ t('common.refresh') }}</button></div>
          @if (webAuth) {
            <table>
              <tbody>
                @for (e of webAuthEntries; track e.key) {
                  <tr><th>{{ e.key }}</th><td class="mono">{{ e.value }}</td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="muted">{{ t('common.loading') }}</p> }
        </div>
      }

      @if (userDialog) {
        <div class="card">
          <h2>{{ t('permissions.users.dialogTitle') }}</h2>
          <div class="toolbar">
            <input [placeholder]="t('permissions.users.dialogPhName')" [(ngModel)]="newUserName" />
            <input [placeholder]="t('permissions.users.dialogPhDisplay')" [(ngModel)]="newUserDisplay" />
            <button (click)="createUser()">{{ t('permissions.users.dialogCreate') }}</button>
            <button class="ghost" (click)="userDialog = false">{{ t('common.cancel') }}</button>
          </div>
        </div>
      }
      @if (roleDialog) {
        <div class="card">
          <h2>{{ t('permissions.roles.dialogTitle') }}</h2>
          <div class="toolbar">
            <input [placeholder]="t('permissions.roles.dialogPhName')" [(ngModel)]="newRoleName" />
            <input [placeholder]="t('permissions.roles.dialogPhDescription')" [(ngModel)]="newRoleDesc" />
            <button (click)="createRole()">{{ t('permissions.roles.dialogCreate') }}</button>
            <button class="ghost" (click)="roleDialog = false">{{ t('common.cancel') }}</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class PermissionsComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  tabs = ['Users', 'Roles', 'Resources', 'Services', 'SQL Privileges', 'Web Auth'];
  tab = 'Users';
  canSecure = false;
  error = '';

  users: any[] = [];
  roles: any[] = [];
  resources: any[] = [];
  services: any[] = [];
  sqlPrivs: any[] = [];
  webAuth: any = null;
  owners: string[] = [];
  ownerRole = '';

  userDialog = false;
  newUser = { name: '', display: '' };
  roleDialog = false;
  newRole = { name: '', desc: '' };
  sqlGrantee = '';
  sqlPriv = '';

  get newUserName() { return this.newUser.name; }
  set newUserName(v: string) { this.newUser.name = v; }
  get newUserDisplay() { return this.newUser.display; }
  set newUserDisplay(v: string) { this.newUser.display = v; }
  get newRoleName() { return this.newRole.name; }
  set newRoleName(v: string) { this.newRole.name = v; }
  get newRoleDesc() { return this.newRole.desc; }
  set newRoleDesc(v: string) { this.newRole.desc = v; }

  /** Dynamic key/value view of the web-auth settings (fields vary by server). */
  get webAuthEntries(): Array<{ key: string; value: string }> {
    if (!this.webAuth) return [];
    return Object.entries(this.webAuth).map(([key, value]) => ({ key, value: String(value) }));
  }

  ngOnInit(): void {
    this.canSecure = this.perms.can(PRIV.SECURE);
    this.loadUsers();
  }

  switchTab(t: string): void {
    this.tab = t;
    this.error = '';
    if (t === 'Users') this.loadUsers();
    else if (t === 'Roles') this.loadRoles();
    else if (t === 'Resources') this.loadResources();
    else if (t === 'Services') this.loadServices();
    else if (t === 'SQL Privileges') this.loadSql();
    else if (t === 'Web Auth') this.loadWebAuth();
  }

  async loadUsers(): Promise<void> {
    try { const l = await this.admin.client.domains.permissions.listUsers(); this.users = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadRoles(): Promise<void> {
    try { const l = await this.admin.client.domains.permissions.listRoles(); this.roles = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadResources(): Promise<void> {
    try { const l = await this.admin.client.domains.permissions.listResources(); this.resources = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadServices(): Promise<void> {
    try { const l = await this.admin.client.domains.permissions.listServices(); this.services = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadSql(): Promise<void> {
    try {
      const q: Record<string, unknown> = {};
      if (this.sqlGrantee) q.grantee = this.sqlGrantee;
      const l = await this.admin.client.domains.permissions.listSQLPrivileges(q);
      this.sqlPrivs = Array.isArray(l) ? l : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadWebAuth(): Promise<void> {
    try { this.webAuth = await this.admin.client.domains.permissions.getWebAuth(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async createUser(): Promise<void> {
    try {
      await this.admin.client.domains.permissions.createUser(this.newUser.name, { Name: this.newUser.name, DisplayName: this.newUser.display } as any);
      this.userDialog = false;
      await this.loadUsers();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeUser(name: string): Promise<void> {
    try { await this.admin.client.domains.permissions.removeUser(name); await this.loadUsers(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createRole(): Promise<void> {
    try {
      await this.admin.client.domains.permissions.createRole(this.newRole.name, { Name: this.newRole.name, Description: this.newRole.desc } as any);
      this.roleDialog = false;
      await this.loadRoles();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeRole(name: string): Promise<void> {
    try { await this.admin.client.domains.permissions.removeRole(name); await this.loadRoles(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadOwners(name: string): Promise<void> {
    this.ownerRole = name;
    try {
      const l = await this.admin.client.domains.permissions.getRoleOwners(name);
      const arr = Array.isArray(l) ? l : [];
      this.owners = arr.map((o: any) => (typeof o === 'string' ? o : o.Name ?? o.name ?? JSON.stringify(o)));
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async grantSql(): Promise<void> {
    try { await this.admin.client.domains.permissions.grantSQLPrivilege({ grantee: this.sqlGrantee, privilege: this.sqlPriv }); await this.loadSql(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async revokeSql(): Promise<void> {
    try { await this.admin.client.domains.permissions.revokeSQLPrivilege({ grantee: this.sqlGrantee, privilege: this.sqlPriv }); await this.loadSql(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
}
