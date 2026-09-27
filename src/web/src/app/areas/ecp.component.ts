import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';

/**
 * ECP (External Client Protocol) — the mechanism by which remote clients and
 * other IRIS instances connect. Settings, data servers, application servers and
 * SSL connections. (Often empty on a fresh single-node instance.)
 *
 * Extended with: data server create/edit (PUT /v2/ecp/data-server) + delete
 * (DELETE ?name, double-confirmed), and per-row SSL connection actions
 * (authorize / reject / remove). All writes gated on canEdit (PRIV.MANAGE).
 */
@Component({
  selector: 'app-ecp',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('ecp.title') }}</h2>
          <p class="muted">{{ t('ecp.subtitle') }}</p>
        </div>
        <div class="toolbar"><button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button></div>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <div class="card" style="margin-bottom:14px">
        <h2>{{ t('ecp.settings') }}</h2>
        @if (settings) {
          <div class="grid cols-2">
            <div>
              <h3>{{ t('ecp.settings.app') }}</h3>
              <table>
                <tbody>
                  @for (row of settingsRows(pickSettings(settings, 'AppServerSettings', 'appServerSettings')); track $index) {
                    <tr><th>{{ row[0] }}</th><td class="mono">{{ row[1] }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
            <div>
              <h3>{{ t('ecp.settings.data') }}</h3>
              <table>
                <tbody>
                  @for (row of settingsRows(pickSettings(settings, 'DataServerSettings', 'dataServerSettings')); track $index) {
                    <tr><th>{{ row[0] }}</th><td class="mono">{{ sslEcpLabel(row[0], row[1]) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else { <p class="empty">{{ t('common.loading') }}</p> }
      </div>

      <div class="grid cols-2">
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('ecp.dataServers') }}</h2>
            <span class="spacer"></span>
            <span class="muted">{{ dataServers.length }}</span>
            @if (canEdit) {
              <button class="ghost" style="padding:2px 8px" (click)="openDataServerForm()">{{ t('ecp.act.new') }}</button>
            }
          </div>

          @if (canEdit && dsFormOpen) {
            <div style="margin-bottom:12px;padding:12px;background:var(--bg-elev-2);border-radius:8px">
              <h3 style="margin:0 0 10px 0">{{ t('ecp.dsForm.title') }}
                @if (dsFormEditing) { <span class="muted">{{ t('ecp.dsForm.editing') }}: <span class="mono">{{ dsFormEditing }}</span></span> }
              </h3>
              <div class="grid cols-2">
                <div class="stat"><input [(ngModel)]="dsForm.name" class="mono" style="width:100%;box-sizing:border-box" placeholder="{{ t('ecp.dsForm.name') }}"><span class="label">{{ t('ecp.dsForm.name') }}</span></div>
                <div class="stat"><input [(ngModel)]="dsForm.address" class="mono" style="width:100%;box-sizing:border-box" placeholder="{{ t('ecp.dsForm.address') }}"><span class="label">{{ t('ecp.dsForm.address') }}</span></div>
                <div class="stat"><input [(ngModel)]="dsForm.port" class="mono" style="width:100%;box-sizing:border-box" placeholder="{{ t('ecp.dsForm.port') }}"><span class="label">{{ t('ecp.dsForm.port') }}</span></div>
                <div class="stat"><input [(ngModel)]="dsForm.databases" class="mono" style="width:100%;box-sizing:border-box" placeholder="{{ t('ecp.dsForm.databases') }}"><span class="label">{{ t('ecp.dsForm.databases') }}</span></div>
              </div>
              <div class="toolbar" style="margin-top:10px">
                <button (click)="saveDataServer()" [disabled]="saving">{{ saving ? t('common.loading') : t('ecp.dsForm.save') }}</button>
                <button class="ghost" (click)="dsFormOpen = false">{{ t('common.cancel') }}</button>
              </div>
            </div>
          }

          @if (dataServers.length) {
            <table>
              <thead><tr><th>{{ t('ecp.col.name') }}</th><th>{{ t('ecp.col.address') }}</th><th>{{ t('ecp.col.status') }}</th><th></th></tr></thead>
              <tbody>
                @for (s of dataServers; track coalesce(s.Name, s.name, $index)) {
                  <tr (click)="selectDataServer(coalesce(s.Name, s.name))" [style.background]="selectedData === (coalesce(s.Name, s.name)) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                    <td class="mono small">{{ coalesce(s.RemoteAddress, s.remoteAddress) }}:{{ coalesce(s.RemotePort, s.remotePort) }}</td>
                    <td><span class="badge" [class.ok]="isNormal(coalesce(s.Status, s.status))">{{ coalesce(s.Status, s.status) }}</span></td>
                    <td class="actions">
                      @if (canEdit) {
                        <button class="ghost" style="padding:2px 8px" (click)="dataServerAction(coalesce(s.Name, s.name), 1)">{{ t('ecp.act.disconnect') }}</button>
                        <button class="ghost" style="padding:2px 8px" (click)="dataServerAction(coalesce(s.Name, s.name), 2)">{{ t('ecp.act.disable') }}</button>
                        <button class="ghost" style="padding:2px 8px" (click)="dataServerAction(coalesce(s.Name, s.name), 3)">{{ t('ecp.act.normal') }}</button>
                        <button class="ghost" style="padding:2px 8px" (click)="editDataServer(coalesce(s.Name, s.name))">{{ t('ecp.act.edit') }}</button>
                        @if (dsConfirmDelete === (coalesce(s.Name, s.name))) {
                          <button class="ghost" style="padding:2px 8px" (click)="deleteDataServer(coalesce(s.Name, s.name))">{{ t('ecp.act.deleteConfirm') }}</button>
                        } @else {
                          <button class="ghost" style="padding:2px 8px" (click)="askDeleteDataServer(coalesce(s.Name, s.name))">{{ t('ecp.act.delete') }}</button>
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('ecp.dataServersEmpty') }}</p> }
        </div>

        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('ecp.appServers') }}</h2>
            <span class="spacer"></span>
            <span class="muted">{{ appServers.length }}</span>
          </div>
          @if (appServers.length) {
            <table>
              <thead><tr><th>{{ t('ecp.col.client') }}</th><th>{{ t('ecp.col.status') }}</th><th>{{ t('ecp.col.ip') }}</th><th>{{ t('ecp.col.port') }}</th></tr></thead>
              <tbody>
                @for (s of appServers; track coalesce(s.ClientName, s.clientName, $index)) {
                  <tr>
                    <td class="mono">{{ coalesce(s.ClientName, s.clientName) }}</td>
                    <td><span class="badge" [class.ok]="isNormal(coalesce(s.Status, s.status))">{{ coalesce(s.Status, s.status) }}</span></td>
                    <td class="mono small">{{ coalesce(s.IPAddress, s.iPAddress) }}</td>
                    <td>{{ coalesce(s.IPPort, s.iPPort) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('ecp.appServersEmpty') }}</p> }
        </div>
      </div>

      @if (selectedData) {
        <div class="card" style="margin-top:14px">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('ecp.dataServerDetail') }}: <span class="mono">{{ selectedData }}</span></h2>
            <span class="spacer"></span>
            <button class="ghost" (click)="clearDataServerDetail()">{{ t('common.cancel') }}</button>
          </div>
          @if (selectedDetail) {
            <div class="grid cols-2">
              <div class="stat"><span class="value mono">{{ jsonOrNone(selectedDetail.Address, selectedDetail.address) }}</span><span class="label">{{ t('ecp.dsForm.address') }}</span></div>
              <div class="stat"><span class="value mono">{{ jsonOrNone(selectedDetail.Port, selectedDetail.port) }}</span><span class="label">{{ t('ecp.dsForm.port') }}</span></div>
            </div>
            @if (selectedDbs.length) {
              <table>
                <thead><tr><th>{{ t('ecp.col.database') }}</th></tr></thead>
                <tbody>
                  @for (d of selectedDbs; track $index) {
                    <tr><td class="mono">{{ coalesce(d.Name, d.name, d) }}</td></tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('ecp.dataServerDbsEmpty') }}</p> }
          } @else { <p class="empty">{{ t('common.loading') }}</p> }
        </div>
      }

      <div class="card" style="margin-top:14px">
        <div class="toolbar" style="margin-bottom:12px">
          <h2 style="margin:0">{{ t('ecp.sslConnections') }}</h2>
          <span class="spacer"></span>
          <span class="muted">{{ sslConnections.length }}</span>
        </div>
        @if (sslConnections.length) {
          <table>
            <thead><tr><th>{{ t('ecp.col.sslComputer') }}</th><th>{{ t('ecp.col.clientIp') }}</th><th>{{ t('ecp.col.status') }}</th><th></th></tr></thead>
            <tbody>
              @for (s of sslConnections; track $index) {
                <tr>
                  <td class="mono">{{ coalesce(s.SSLComputerName, s.sSLComputerName) }}</td>
                  <td class="mono small">{{ coalesce(s.ClientIP, s.clientIP) }}</td>
                  <td><span class="badge" [class.ok]="isAuthorized(coalesce(s.Status, s.status))">{{ coalesce(s.Status, s.status) }}</span></td>
                  <td class="actions">
                    @if (canEdit) {
                      <button class="ghost" style="padding:2px 8px" (click)="sslAction(coalesce(s.SSLComputerName, s.sSLComputerName), 'authorize')">{{ t('ecp.act.authorize') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="sslAction(coalesce(s.SSLComputerName, s.sSLComputerName), 'reject')">{{ t('ecp.act.reject') }}</button>
                      @if (sslConfirmRemove === (coalesce(s.SSLComputerName, s.sSLComputerName))) {
                        <button class="ghost" style="padding:2px 8px" (click)="removeSslConnection(coalesce(s.SSLComputerName, s.sSLComputerName))">{{ t('ecp.act.removeConfirm') }}</button>
                      } @else {
                        <button class="ghost" style="padding:2px 8px" (click)="askRemoveSslConnection(coalesce(s.SSLComputerName, s.sSLComputerName))">{{ t('ecp.act.remove') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else { <p class="empty">{{ t('ecp.sslEmpty') }}</p> }
      </div>
    </div>
  `,
})
export class EcpComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  settings: any = null;
  dataServers: any[] = [];
  appServers: any[] = [];
  sslConnections: any[] = [];
  selectedData = '';
  selectedDetail: any = null;
  selectedDbs: any[] = [];
  loading = false;
  saving = false;
  error = '';

  // Data server create/edit form.
  dsFormOpen = false;
  dsFormEditing = '';
  dsForm = { name: '', address: '', port: '', databases: '' };

  // Two-click confirm targets (destructive ops).
  dsConfirmDelete = '';
  sslConfirmRemove = '';

  // Live getter (see SystemComponent): re-evaluated each CD cycle.
  get canEdit(): boolean { return this.perms.can(PRIV.MANAGE); }

  /** The API localizes status text to the session language (a zh browser gets
   *  "正常", not "Normal"), so exact English matching misses. The app supports
   *  exactly two locales (en, zh); the zh keywords below are taken from
   *  IRIS's own zh-cn message catalog (allmessages_zh-cn.xml). */
  isNormal(s: any): boolean {
    const v = String(coalesce(s, '')).toLowerCase();
    return v.includes('normal') || v.includes('正常');
  }

  isAuthorized(s: any): boolean {
    const v = String(coalesce(s, '')).toLowerCase();
    return v.includes('authorized') || v.includes('已授权');
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.settings = await this.admin.client.domains.ecp.getSettings().catch(() => null);
      const [ds, as, ssl] = await Promise.all([
        this.admin.client.domains.ecp.listDataServers().catch(() => []),
        this.admin.client.domains.ecp.listApplicationServers().catch(() => []),
        this.admin.client.domains.ecp.listSslConnections().catch(() => []),
      ]);
      this.dataServers = Array.isArray(ds) ? ds : [];
      this.appServers = Array.isArray(as) ? as : [];
      this.sslConnections = Array.isArray(ssl) ? ssl : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.loading = false;
  }

  async selectDataServer(name: string): Promise<void> {
    this.selectedData = name;
    this.selectedDetail = null;
    this.selectedDbs = [];
    if (!name) return;
    const [detail, dbs] = await Promise.all([
      this.admin.client.domains.ecp.getDataServer(name).catch(() => null),
      this.admin.client.domains.ecp.listDataServerDatabases(name).catch(() => []),
    ]);
    this.selectedDetail = detail === undefined || detail === null ? null : detail;
    this.selectedDbs = Array.isArray(dbs) ? dbs : [];
  }

  clearDataServerDetail(): void {
    this.selectedData = '';
    this.selectedDetail = null;
    this.selectedDbs = [];
  }

  /** Render a settings value (which may be an object) as JSON, or "none". */
  jsonOrNone(a: unknown, b: unknown): string {
    const v = a !== undefined && a !== null ? a : b;
    if (v === undefined || v === null || v === '') return this.t('common.none');
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  }

  /** Pick a settings sub-object by PascalCase/lowercase key (template-safe). */
  pickSettings(o: any, a: string, b: string): unknown {
    return o && typeof o === 'object' ? (o[a] ?? o[b]) : null;
  }

  /** Normalize a settings object into [key, value][] rows (template-safe). */
  settingsRows(v: unknown): [string, unknown][] {
    const o = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    return Object.entries(o);
  }

  /** Render a settings row value; the SSLECPServer enum becomes an i18n label. */
  sslEcpLabel(key: string, v: unknown): string {
    if (key === 'SSLECPServer') {
      const n = Number(v);
      if (n === 0) return this.t('ecp.settings.sslDisabled');
      if (n === 1) return this.t('ecp.settings.sslEnabled');
      if (n === 2) return this.t('ecp.settings.sslRequired');
    }
    return v === undefined || v === null ? this.t('common.none') : String(v);
  }

  /** Normalize an API value (possibly a number) to a form-string. */
  norm(v: unknown): string {
    return v === undefined || v === null ? '' : String(v);
  }

  async dataServerAction(name: string, action: 1 | 2 | 3): Promise<void> {
    if (!name) return;
    this.error = '';
    try {
      await this.admin.client.domains.ecp.dataServerAction(name, action);
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  // --- Data server create/edit (PUT /v2/ecp/data-server) -------------------

  openDataServerForm(): void {
    this.dsForm = { name: '', address: '', port: '', databases: '' };
    this.dsFormEditing = '';
    this.dsFormOpen = true;
  }

  async editDataServer(name: string): Promise<void> {
    if (!name) return;
    this.dsForm = { name, address: '', port: '', databases: '' };
    this.dsFormEditing = name;
    this.dsFormOpen = true;
    const d: any = await this.admin.client.domains.ecp.getDataServer(name).catch(() => null);
    if (d !== undefined && d !== null) {
      this.dsForm.address = this.norm(d.Address !== undefined ? d.Address : d.address);
      this.dsForm.port = this.norm(d.Port !== undefined ? d.Port : d.port);
    }
  }

  async saveDataServer(): Promise<void> {
    const name = this.dsForm.name.trim();
    if (!name) {
      this.error = this.t('ecp.dsForm.nameRequired');
      return;
    }
    this.error = '';
    this.saving = true;
    try {
      await this.admin.client.domains.ecp.upsertDataServer({
        name,
        address: this.dsForm.address.trim(),
        port: this.dsForm.port.trim(),
        databases: this.dsForm.databases.trim(),
      });
      this.dsFormOpen = false;
      this.dsFormEditing = '';
      if (this.selectedData === name) await this.selectDataServer(name);
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.saving = false;
  }

  // --- Data server delete (DELETE ?name — double-confirmed) ----------------

  askDeleteDataServer(name: string): void {
    this.dsConfirmDelete = name;
  }

  async deleteDataServer(name: string): Promise<void> {
    if (!name || this.dsConfirmDelete !== name) return;
    this.dsConfirmDelete = '';
    this.error = '';
    try {
      await this.admin.client.domains.ecp.removeDataServer(name);
      if (this.selectedData === name) this.clearDataServerDetail();
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  // --- SSL connection actions ----------------------------------------------

  async sslAction(name: string, kind: 'authorize' | 'reject'): Promise<void> {
    if (!name) return;
    this.error = '';
    try {
      if (kind === 'authorize') {
        await this.admin.client.domains.ecp.authorizeSslConnection(name);
      } else {
        await this.admin.client.domains.ecp.rejectSslConnection(name);
      }
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  askRemoveSslConnection(name: string): void {
    this.sslConfirmRemove = name;
  }

  async removeSslConnection(name: string): Promise<void> {
    if (!name || this.sslConfirmRemove !== name) return;
    this.sslConfirmRemove = '';
    this.error = '';
    try {
      await this.admin.client.domains.ecp.removeSslConnection(name);
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }
}
