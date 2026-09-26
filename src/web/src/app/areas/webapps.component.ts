import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';

/** Curated fields of the rich web-app detail (GET /v2/web-app?name, ~55 fields live). */
const APP_DETAIL_FIELDS = [
  'Enabled', 'Path', 'Resource', 'AuthenticationMethods', 'AutheEnabled',
  'JWTAuthEnabled', 'TwoFactorEnabled', 'WSGIAppLocation', 'WSGIAppName',
  'WSGICallable', 'WSGIDebug', 'CSPZENEnabled', 'DeepSeeEnabled', 'AutoCompile',
  'DispatchClass', 'CSRFToken', 'CookiePath', 'CorsAllowlist',
  'CorsCredentialsAllowed', 'CorsHeadersList', 'ChangePasswordPage',
  'ErrorPage', 'LoginPage', 'UseCookies', 'SessionScope', 'ServeFiles',
  'Timeout', 'Description',
];

/** Fields of a PCT access entry (list + detail, live-verified). */
const PCT_FIELDS = ['Name', 'AllowType', 'Class', 'AllowAccess', 'System'];

/**
 * Web Applications & REST — manage CSP/REST web applications, PCT access,
 * sessions, namespaces. List data typed loosely; rendered defensively.
 *
 * Extended: web-app detail (GET /v2/web-app?name as a key/value table),
 * web-app delete (DELETE /v2/web-app?name — DANGEROUS double-confirm) and
 * PCT access CRUD (list / detail / create-edit / delete), gated on
 * %Admin_Secure.
 */
@Component({
  selector: 'app-webapps',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('webapps.title') }}</h2>
          <p class="muted">{{ t('webapps.subtitle') }}</p>
        </div>
        <div class="toolbar">
          <button (click)="load()" [disabled]="loading">{{ loading ? t('webapps.loading') : t('common.refresh') }}</button>
        </div>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (notice) { <div class="card"><p class="notice">{{ notice }}</p></div> }

      <div class="grid cols-2">
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('webapps.list') }}</h2>
            <span class="spacer"></span>
            @if (canManage) {
              <button (click)="createDialog = true" style="padding:4px 10px">{{ t('webapps.new') }}</button>
            }
          </div>
          @if (apps.length) {
            <table>
              <thead><tr><th>{{ t('webapps.col.name') }}</th><th>{{ t('webapps.col.namespace') }}</th><th>{{ t('webapps.col.status') }}</th><th></th></tr></thead>
              <tbody>
                @for (a of apps; track coalesce(a.Name, a.name)) {
                  <tr (click)="selectApp(a)" [style.background]="selName() === coalesce(a.Name, a.name) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(a.Name, a.name) }}</td>
                    <td class="mono">{{ coalesce(a.Namespace, a.namespace) }}</td>
                    <td><span class="badge" [class.ok]="coalesce(a.Enabled, a.enabled)">{{ (coalesce(a.Enabled, a.enabled)) ? t('common.on') : t('common.off') }}</span></td>
                    <td>
                      @if (canManage) {
                        <button class="ghost" style="padding:2px 8px" (click)="$event.stopPropagation(); toggleApp(a)">
                          {{ (coalesce(a.Enabled, a.enabled)) ? t('webapps.disable') : t('webapps.enable') }}
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="empty">{{ t('webapps.empty') }}</p>
          }
        </div>

        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('webapps.detail') }}</h2>
            <span class="spacer"></span>
            @if (canSecure && selected) {
              @if (appDeleteArmed) {
                <button class="ghost danger" style="padding:4px 10px" (click)="deleteApp()" [disabled]="appBusy">{{ t('webapps.deleteArmed') }}</button>
                <button class="ghost" style="padding:4px 10px" (click)="appDeleteArmed = false">{{ t('common.cancel') }}</button>
              } @else {
                <button class="ghost danger" style="padding:4px 10px" (click)="armDeleteApp()" [disabled]="appBusy">{{ t('webapps.delete') }}</button>
              }
            }
          </div>
          @if (selected) {
            <p class="muted mono">
              {{ coalesce(selected.Name, selected.name) }} · {{ coalesce(selected.Namespace, selected.namespace) }}
            </p>
            <div class="toolbar" style="margin:10px 0">
              <button (click)="loadDetail()">{{ t('webapps.detail.reload') }}</button>
              <button (click)="loadPct()">{{ t('webapps.loadPct') }}</button>
              @if (canSecure) {
                <button (click)="openPctCreate()">{{ t('webapps.pct.new') }}</button>
              }
            </div>

            @if (detailRows.length) {
              <h3>{{ t('webapps.config') }}</h3>
              <table>
                <tbody>
                  @for (row of detailRows; track row.key) {
                    <tr><td class="label">{{ row.key }}</td><td class="mono small">{{ row.value }}</td></tr>
                  }
                </tbody>
              </table>
            } @else if (detailLoaded) {
              <p class="muted">{{ t('webapps.detail.empty') }}</p>
            }

            <h3>{{ t('webapps.pct.title') }}</h3>
            @if (pct.length) {
              <table>
                <thead>
                  <tr>
                    <th>{{ t('webapps.pct.col.name') }}</th>
                    <th>{{ t('webapps.pct.col.allowType') }}</th>
                    <th>{{ t('webapps.pct.col.class') }}</th>
                    <th>{{ t('webapps.pct.col.access') }}</th>
                    <th>{{ t('webapps.pct.col.system') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of pct; track coalesce(p.Name, p.name)) {
                    <tr>
                      <td class="mono">{{ coalesce(p.Name, p.name) }}</td>
                      <td>{{ coalesce(p.AllowType, p.allowtype) }}</td>
                      <td class="mono">{{ coalesce(p.Class, p.classname) }}</td>
                      <td><span class="badge" [class.ok]="truthy(p.AllowAccess, p.allowaccess)">{{ truthy(p.AllowAccess, p.allowaccess) ? t('common.on') : t('common.off') }}</span></td>
                      <td class="mono">{{ coalesce(p.System, p.system) }}</td>
                      <td>
                        @if (canSecure) {
                          <button class="ghost" style="padding:2px 8px" (click)="$event.stopPropagation(); loadPctDetail(p)">{{ t('webapps.pct.view') }}</button>
                          <button class="ghost" style="padding:2px 8px" (click)="$event.stopPropagation(); editPct(p)">{{ t('webapps.pct.edit') }}</button>
                          <button class="ghost danger" style="padding:2px 8px" (click)="$event.stopPropagation(); deletePct(p)">{{ t('webapps.pct.delete') }}</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else if (pctLoaded) {
              <p class="muted">{{ t('webapps.pct.empty') }}</p>
            }

            @if (pctDetailRows.length) {
              <h3>{{ t('webapps.pct.detail') }}</h3>
              <table>
                <tbody>
                  @for (row of pctDetailRows; track row.key) {
                    <tr><td class="label">{{ row.key }}</td><td class="mono small">{{ row.value }}</td></tr>
                  }
                </tbody>
              </table>
            }

            @if (canSecure) {
              <h3 class="danger">{{ t('webapps.danger') }}</h3>
              <p class="muted small">{{ t('webapps.dangerNote') }}</p>
            }
          } @else {
            <p class="empty">{{ t('webapps.detail.select') }}</p>
          }
        </div>
      </div>

      <div class="grid cols-2">
        <div class="card">
          <h2>{{ t('webapps.sessions') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadSessions()">{{ t('common.refresh') }}</button></div>
          @if (sessions.length) {
            <table>
              <thead><tr><th>{{ t('webapps.sessions.col.session') }}</th><th>{{ t('webapps.sessions.col.user') }}</th><th>{{ t('webapps.sessions.col.app') }}</th><th></th></tr></thead>
              <tbody>
                @for (s of sessions; track coalesce(s.ID, s.id)) {
                  <tr>
                    <td class="mono">{{ coalesce(s.ID, s.id) }}</td>
                    <td>{{ coalesce(s.Username, s.username) }}</td>
                    <td>{{ coalesce(s.ApplicationName, s.appname) }}</td>
                    <td><button class="ghost danger" style="padding:2px 8px" (click)="killSession(coalesce(s.ID, s.id))">{{ t('webapps.sessions.kill') }}</button></td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('webapps.sessions.empty') }}</p> }
        </div>
        <div class="card">
          <h2>{{ t('webapps.namespaces') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadNamespaces()">{{ t('common.refresh') }}</button></div>
          @if (namespaces.length) {
            <table>
              <thead><tr><th>{{ t('webapps.namespaces.col.name') }}</th><th>{{ t('webapps.namespaces.col.globals') }}</th></tr></thead>
              <tbody>
                @for (n of namespaces; track coalesce(n.Name, n.name)) {
                  <tr><td class="mono">{{ coalesce(n.Name, n.name) }}</td><td><span class="badge ok">{{ coalesce(n.Globals, n.globals) }}</span></td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      </div>

      @if (pctFormOpen) {
        <div class="card">
          <h2>{{ t('webapps.pct.create') }}</h2>
          <table>
            <tbody>
              <tr><td class="label">{{ t('webapps.pct.f.name') }}</td><td><input placeholder="{{ t('webapps.pct.ph.name') }}" [(ngModel)]="pctFormName" style="width:220px" /></td></tr>
              <tr><td class="label">{{ t('webapps.pct.f.allowType') }}</td><td><input placeholder="{{ t('webapps.pct.ph.allowType') }}" [(ngModel)]="pctFormAllowType" style="width:220px" /></td></tr>
              <tr><td class="label">{{ t('webapps.pct.f.class') }}</td><td><input placeholder="{{ t('webapps.pct.ph.class') }}" [(ngModel)]="pctFormClass" style="width:220px" /></td></tr>
              <tr><td class="label">{{ t('webapps.pct.f.allowAccess') }}</td><td><input type="checkbox" [(ngModel)]="pctFormAllowAccess" /></td></tr>
              <tr><td class="label">{{ t('webapps.pct.f.system') }}</td><td><input placeholder="{{ t('webapps.pct.ph.system') }}" [(ngModel)]="pctFormSystem" style="width:220px" /></td></tr>
            </tbody>
          </table>
          <div class="toolbar">
            <button (click)="savePct()" [disabled]="pctBusy">{{ t('webapps.pct.save') }}</button>
            <button class="ghost" (click)="pctFormOpen = false">{{ t('common.cancel') }}</button>
          </div>
          <p class="muted small">{{ t('webapps.pct.note') }}</p>
        </div>
      }

      @if (createDialog) {
        <div class="card">
          <h2>{{ t('webapps.create') }}</h2>
          <div class="toolbar">
            <input placeholder="{{ t('webapps.create.name') }}" [(ngModel)]="newName" />
            <input placeholder="/wpath/" [(ngModel)]="newWpath" />
            <button (click)="createApp()">{{ t('common.create') }}</button>
            <button class="ghost" (click)="createDialog = false">{{ t('common.cancel') }}</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class WebAppsComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  // Live permission getters (re-evaluated each CD cycle):
  get canManage(): boolean {
    return this.perms.can(PRIV.MANAGE);
  }
  get canSecure(): boolean {
    return this.perms.can(PRIV.SECURE);
  }

  apps: any[] = [];
  selected: any = null;
  appDetail: any = null;
  detailRows: { key: string; value: string }[] = [];
  detailLoaded = false;
  appBusy = false;
  appDeleteArmed = false;
  pct: any[] = [];
  pctLoaded = false;
  pctDetail: any = null;
  pctDetailRows: { key: string; value: string }[] = [];
  sessions: any[] = [];
  namespaces: any[] = [];
  loading = false;
  error = '';
  notice = '';

  createDialog = false;
  newName = '';
  newWpath = '';

  // PCT access form (create/edit — PUT /v2/web-app/pct-access, body `name` required).
  pctFormOpen = false;
  pctFormName = '';
  pctFormAllowType = '';
  pctFormClass = '';
  pctFormAllowAccess = false;
  pctFormSystem = '';
  pctBusy = false;

  ngOnInit(): void {
    this.load();
    this.loadSessions();
    this.loadNamespaces();
  }

  /** True when a value (either casing) is truthy. */
  truthy(a: unknown, b: unknown): boolean {
    const v = a !== undefined && a !== null ? a : b;
    return v === true || v === 'true' || v === 'True' || v === 1 || v === '1';
  }

  /** Format one API value (may be a string/boolean/array) for display. */
  private fmt(v: unknown): string {
    if (v === undefined || v === null || v === '') return this.t('common.none');
    if (Array.isArray(v)) return v.join(', ');
    if (v === true || v === 'true' || v === 'True' || v === 1) return this.t('common.on');
    if (v === false || v === 'false' || v === 'False' || v === 0) return this.t('common.off');
    return String(v);
  }

  /** Build a key/value row list (values normalized in TS, not the template). */
  private rows(obj: any, keys: string[]): { key: string; value: string }[] {
    return keys.map((k) => ({ key: k, value: this.fmt(obj[k]) }));
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const list = await this.admin.client.domains.webApps.list();
      this.apps = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.loading = false;
  }

  /** Name of the selected app ('' when nothing is selected). Template-safe. */
  selName(): string {
    return this.selected ? coalesce(this.selected.Name, this.selected.name, '') : '';
  }

  selectApp(a: any): void {
    this.selected = a;
    this.pct = [];
    this.pctLoaded = false;
    this.pctDetail = null;
    this.pctDetailRows = [];
    this.appDetail = null;
    this.detailRows = [];
    this.detailLoaded = false;
    this.appDeleteArmed = false;
    this.loadDetail();
    this.loadPct();
  }

  /** Web-app detail (GET /v2/web-app?name) as a key/value table. */
  async loadDetail(): Promise<void> {
    if (!this.selected) return;
    try {
      const name = coalesce(this.selected.Name, this.selected.name, '');
      this.appDetail = await this.admin.client.domains.webApps.get(name).catch(() => null);
      this.detailRows = this.rows(this.appDetail, APP_DETAIL_FIELDS);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.detailLoaded = true;
  }

  // --- web-app delete (DELETE /v2/web-app?name — DANGEROUS, double-confirm) ---

  /** First step of the double-confirm: confirm dialog, then arm. */
  armDeleteApp(): void {
    if (!this.selected || this.appBusy) return;
    const name = coalesce(this.selected.Name, this.selected.name, '');
    if (!window.confirm(this.t('webapps.confirm.delete') + ' ' + name + ' ?')) return;
    this.appDeleteArmed = true;
  }

  /** Second step of the double-confirm: actually delete. */
  async deleteApp(): Promise<void> {
    if (!this.selected || !this.appDeleteArmed || this.appBusy) return;
    this.appBusy = true;
    this.error = '';
    this.notice = '';
    try {
      const name = coalesce(this.selected.Name, this.selected.name, '');
      await this.admin.client.domains.webApps.removeApp(name);
      this.notice = this.t('webapps.deleted');
      this.selected = null;
      this.appDetail = null;
      this.detailRows = [];
      this.pct = [];
      this.pctLoaded = false;
      this.pctDetail = null;
      this.pctDetailRows = [];
      this.appDeleteArmed = false;
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.appBusy = false;
  }

  // --- PCT access (GET /v2/web-app/pct-accesses?name, GET/PUT/DELETE /v2/web-app/pct-access?name) ---

  async loadPct(): Promise<void> {
    if (!this.selected) return;
    try {
      const name = coalesce(this.selected.Name, this.selected.name, '');
      const list = await this.admin.client.domains.webApps.listPctAccess(name).catch(() => []);
      this.pct = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.pctLoaded = true;
  }

  /** PCT access detail (GET /v2/web-app/pct-access?name). */
  async loadPctDetail(p: any): Promise<void> {
    const name = coalesce(p.Name, p.name, '');
    if (!name) return;
    try {
      this.pctDetail = await this.admin.client.domains.webApps.getPctAccess(name).catch(() => null);
      this.pctDetailRows = this.rows(this.pctDetail, PCT_FIELDS);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  /** Reset the PCT form for a new entry. */
  openPctCreate(): void {
    this.pctFormName = '';
    this.pctFormAllowType = '';
    this.pctFormClass = '';
    this.pctFormAllowAccess = false;
    this.pctFormSystem = '';
    this.pctFormOpen = true;
  }

  /** Pre-fill the PCT form from a list row (edit mode). */
  editPct(p: any): void {
    this.pctFormName = String(coalesce(p.Name, p.name, ''));
    this.pctFormAllowType = String(coalesce(p.AllowType, p.allowtype, ''));
    this.pctFormClass = String(coalesce(p.Class, p.classname, ''));
    this.pctFormAllowAccess = this.truthy(p.AllowAccess, p.allowaccess);
    this.pctFormSystem = String(coalesce(p.System, p.system, ''));
    this.pctFormOpen = true;
  }

  /** Create or edit (PUT /v2/web-app/pct-access; body `name` required). */
  async savePct(): Promise<void> {
    const name = this.pctFormName.trim();
    if (!name || this.pctBusy) return;
    this.pctBusy = true;
    this.error = '';
    this.notice = '';
    try {
      const body: { name: string; AllowAccess: boolean; AllowType?: string; Class?: string; System?: string } = {
        name,
        AllowAccess: this.pctFormAllowAccess === true,
      };
      if (this.pctFormAllowType) body.AllowType = this.pctFormAllowType;
      if (this.pctFormClass) body.Class = this.pctFormClass;
      if (this.pctFormSystem) body.System = this.pctFormSystem;
      await this.admin.client.domains.webApps.upsertPctAccess(name, body);
      this.notice = this.t('webapps.pct.saved');
      this.pctFormOpen = false;
      await this.loadPct();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.pctBusy = false;
  }

  /** Delete a PCT access entry (DELETE /v2/web-app/pct-access?name) — single confirm. */
  async deletePct(p: any): Promise<void> {
    const name = coalesce(p.Name, p.name, '');
    if (!name || this.pctBusy) return;
    if (!window.confirm(this.t('webapps.pct.confirm.delete') + ' ' + name + ' ?')) return;
    this.pctBusy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.webApps.removePctAccess(name);
      this.notice = this.t('webapps.pct.deleted');
      if (this.pctDetail === p) {
        this.pctDetail = null;
        this.pctDetailRows = [];
      }
      await this.loadPct();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.pctBusy = false;
  }

  // --- existing: create / toggle / sessions / namespaces --------------------

  async toggleApp(a: any): Promise<void> {
    try {
      const name = coalesce(a.Name, a.name, '');
      const enabled = coalesce(a.Enabled, a.enabled, false);
      await this.admin.client.domains.webApps.update(name, { Enabled: !this.truthy(enabled, null) } as any);
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async createApp(): Promise<void> {
    try {
      await this.admin.client.domains.webApps.create(this.newName, { Name: this.newName, WPath: this.newWpath } as any);
      this.createDialog = false;
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async loadSessions(): Promise<void> {
    try {
      const list = await this.admin.client.domains.webApps.listSessions();
      this.sessions = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async killSession(id: string): Promise<void> {
    try {
      await this.admin.client.domains.webApps.removeSession(id);
      await this.loadSessions();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async loadNamespaces(): Promise<void> {
    try {
      const list = await this.admin.client.domains.webApps.listNamespaces();
      this.namespaces = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }
}
