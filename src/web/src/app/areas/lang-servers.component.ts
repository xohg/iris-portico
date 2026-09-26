import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';

/**
 * External (gateway) language servers — the Object Gateway connections IRIS uses
 * to talk to Java, .NET, Python, R, ML, XSLT, JDBC/ODBC and Remote gateways.
 * List, inspect, view activity, start/stop, create/edit, and delete each server.
 */
@Component({
  selector: 'app-lang-servers',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('lang.title') }}</h2>
          <p class="muted">{{ t('lang.subtitle') }}</p>
        </div>
        <div class="toolbar">
          @if (canEdit) {
            <button (click)="openCreate()">{{ t('lang.new') }}</button>
          }
          <button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button>
        </div>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (notice) { <div class="card"><p class="notice">{{ notice }}</p></div> }

      <div class="grid cols-2">
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('lang.list') }}</h2>
            <span class="spacer"></span>
            <span class="muted">{{ servers.length }}</span>
          </div>
          @if (servers.length) {
            <table>
              <thead><tr><th>{{ t('lang.col.name') }}</th><th>{{ t('lang.col.port') }}</th><th>{{ t('lang.col.type') }}</th></tr></thead>
              <tbody>
                @for (s of servers; track coalesce(s.Name, s.name, $index)) {
                  <tr (click)="selectServer(coalesce(s.Name, s.name))" [style.background]="selected === (coalesce(s.Name, s.name)) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                    <td>{{ coalesce(s.Port, s.port) }}</td>
                    <td><span class="badge ok">{{ coalesce(s.Type, s.type) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('lang.empty') }}</p> }
        </div>

        <div class="card">
          <h2>{{ t('lang.detail') }}</h2>
          @if (!selected) {
            <p class="empty">{{ t('lang.select') }}</p>
          } @else {
            <p class="muted mono">{{ selected }}</p>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="loadDetail()">{{ t('common.refresh') }}</button>
              @if (canEdit) {
                <button (click)="openEdit()">{{ t('lang.edit') }}</button>
                @if (running) {
                  <button class="ghost danger" (click)="stop()" [disabled]="busy">{{ t('lang.stop') }}</button>
                } @else {
                  <button class="ghost" (click)="start()" [disabled]="busy">{{ t('lang.start') }}</button>
                }
                <button class="ghost danger" (click)="armDelete()" [disabled]="busy">{{ t('common.delete') }}</button>
                @if (deleteArmed) {
                  <button class="ghost danger" (click)="doDelete()" [disabled]="busy">{{ t('lang.deleteConfirm') }}</button>
                  <button class="ghost" (click)="cancelDelete()" [disabled]="busy">{{ t('common.cancel') }}</button>
                }
              }
            </div>
            @if (detail) {
              <table>
                <tbody>
                  <tr><th>{{ t('lang.col.type') }}</th><td><span class="badge ok">{{ coalesce(detail.Type, detail.type) }}</span></td></tr>
                  <tr><th>{{ t('lang.col.port') }}</th><td>{{ coalesce(detail.Port, detail.port) }}</td></tr>
                  <tr><th>{{ t('lang.bind') }}</th><td class="mono">{{ coalesce(detail.BindToIPAddress, detail.bindToIPAddress) }}</td></tr>
                  <tr><th>{{ t('lang.resource') }}</th><td class="mono">{{ coalesce(detail.Resource, detail.resource) }}</td></tr>
                  <tr><th>{{ t('lang.connTimeout') }}</th><td>{{ coalesce(detail.ConnectionTimeout, detail.connectionTimeout) }} s</td></tr>
                  <tr><th>{{ t('lang.initTimeout') }}</th><td>{{ coalesce(detail.InitializationTimeout, detail.initializationTimeout) }} s</td></tr>
                  <tr><th>{{ t('lang.sharedMem') }}</th><td>{{ truthy(detail.UseSharedMemory, detail.useSharedMemory) ? t('common.on') : t('common.off') }}</td></tr>
                  <tr><th>{{ t('lang.sslServer') }}</th><td class="mono">{{ coalesce(detail.SSLConfigurationServer, detail.sslConfigurationServer) || t('common.none') }}</td></tr>
                  <tr><th>{{ t('lang.sslClient') }}</th><td class="mono">{{ coalesce(detail.SSLConfigurationClient, detail.sslConfigurationClient) || t('common.none') }}</td></tr>
                </tbody>
              </table>
            }
            @if (activity) {
              <h3 style="margin-top:14px">{{ t('lang.activity') }}</h3>
              <p class="muted">{{ t('lang.running') }}: {{ activity.CurrentlyRunning ? t('common.on') : t('common.off') }}</p>
              @if (activity.Activity && activity.Activity.length) {
                <table>
                  <thead><tr><th>{{ t('lang.act.time') }}</th><th>{{ t('lang.act.type') }}</th><th>{{ t('lang.act.text') }}</th></tr></thead>
                  <tbody>
                    @for (a of activity.Activity; track $index) {
                      <tr>
                        <td class="small">{{ coalesce(a.DateTime, a.dateTime) }}</td>
                        <td><span class="badge" [class.ok]="coalesce(a.RecordType, a.recordType) === 'Info'" [class.danger]="coalesce(a.RecordType, a.recordType) === 'Error'">{{ coalesce(a.RecordType, a.recordType) }}</span></td>
                        <td class="small">{{ coalesce(a.Text, a.text) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else { <p class="empty">{{ t('lang.activityEmpty') }}</p> }
            }
          }
        </div>
      </div>

      @if (editOpen) {
        <div class="card">
          <h2>{{ editMode === 'create' ? t('lang.new') : t('lang.edit') }}</h2>
          <div class="toolbar" style="margin-bottom:10px">
            <span class="label">{{ t('lang.col.name') }}</span>
            <input [disabled]="editMode === 'edit'" [(ngModel)]="editName" style="width:240px" />
            <span class="label">{{ t('lang.col.type') }}</span>
            <select [(ngModel)]="editType" style="width:140px">
              <option value="Java">Java</option>
              <option value="XSLT">XSLT</option>
              <option value="JDBC">JDBC</option>
              <option value="ODBC">ODBC</option>
              <option value="ML">ML</option>
              <option value="R">R</option>
              <option value=".NET">.NET</option>
              <option value="Python">Python</option>
              <option value="Remote">Remote</option>
            </select>
            <span class="label">{{ t('lang.col.port') }}</span>
            <input type="number" [(ngModel)]="editPort" style="width:130px" />
          </div>
          <div class="toolbar" style="margin-bottom:10px">
            <span class="label">{{ t('lang.bind') }}</span>
            <input [(ngModel)]="editBind" style="width:180px" />
            <span class="label">{{ t('lang.resource') }}</span>
            <input [(ngModel)]="editResource" style="width:240px" />
          </div>
          <div class="toolbar" style="margin-bottom:10px">
            <span class="label">{{ t('lang.connTimeout') }}</span>
            <input type="number" [(ngModel)]="editConnTimeout" style="width:130px" />
            <span class="label">{{ t('lang.initTimeout') }}</span>
            <input type="number" [(ngModel)]="editInitTimeout" style="width:130px" />
          </div>
          <div class="toolbar" style="margin-bottom:10px">
            <span class="label">{{ t('lang.sslServer') }}</span>
            <input [(ngModel)]="editSslServer" style="width:200px" />
            <span class="label">{{ t('lang.sslClient') }}</span>
            <input [(ngModel)]="editSslClient" style="width:200px" />
          </div>
          <div class="toolbar" style="margin-bottom:10px">
            <label style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" [(ngModel)]="editSharedMem" />
              {{ t('lang.sharedMem') }}
            </label>
          </div>
          <div class="toolbar">
            <button (click)="saveEdit()" [disabled]="busy">{{ editMode === 'create' ? t('common.create') : t('lang.save') }}</button>
            <button class="ghost" (click)="closeEdit()">{{ t('common.cancel') }}</button>
          </div>
          @if (editMode === 'create') { <p class="muted small">{{ t('lang.createNote') }}</p> }
        </div>
      }
    </div>
  `,
})
export class LangServersComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  servers: any[] = [];
  selected = '';
  detail: any = null;
  activity: any = null;
  running = false;
  loading = false;
  busy = false;
  error = '';
  notice = '';

  // Create/edit form state.
  editOpen = false;
  editMode: 'create' | 'edit' = 'create';
  editName = '';
  editType = 'Java';
  editPort: number | null = null;
  editBind = '';
  editResource = '';
  editConnTimeout: number | null = null;
  editInitTimeout: number | null = null;
  editSharedMem = false;
  editSslServer = '';
  editSslClient = '';

  // Two-step delete (DANGEROUS): first click arms, second click fires.
  deleteArmed = false;

  // Live getter (see SystemComponent): re-evaluated each CD cycle.
  get canEdit(): boolean { return this.perms.can(PRIV.EXT_LANG_EDIT); }

  ngOnInit(): void {
    this.load();
  }

  truthy(a: unknown, b: unknown): boolean {
    const v = a !== undefined && a !== null ? a : b;
    return v === true || v === 'true' || v === 'True';
  }

  /** Normalize a possibly-string number from the API into number|null. */
  num(v: unknown): number | null {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const list = await this.admin.client.domains.extLang.list();
      this.servers = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.loading = false;
  }

  selectServer(name: string): void {
    this.selected = name;
    this.detail = null;
    this.activity = null;
    this.deleteArmed = false;
    this.editOpen = false;
    this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    if (!this.selected) return;
    try {
      this.detail = await this.admin.client.domains.extLang.get(this.selected);
      const act = await this.admin.client.domains.extLang.activity(this.selected).catch(() => null);
      this.activity = act;
      this.running = !!(act as any)?.CurrentlyRunning;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async start(): Promise<void> {
    if (!this.selected || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.extLang.start(this.selected);
      this.notice = this.t('lang.started') + ' ' + this.selected;
      await this.loadDetail();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async stop(): Promise<void> {
    if (!this.selected || this.busy) return;
    if (!window.confirm(this.t('lang.stopConfirm') + ' ' + this.selected + ' ?')) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.extLang.stop(this.selected);
      this.notice = this.t('lang.stopped') + ' ' + this.selected;
      await this.loadDetail();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- create / edit -------------------------------------------------------

  openCreate(): void {
    this.editMode = 'create';
    this.editName = '';
    this.editType = 'Java';
    this.editPort = null;
    this.editBind = '';
    this.editResource = '';
    this.editConnTimeout = null;
    this.editInitTimeout = null;
    this.editSharedMem = false;
    this.editSslServer = '';
    this.editSslClient = '';
    this.editOpen = true;
  }

  openEdit(): void {
    if (!this.selected) return;
    this.editMode = 'edit';
    this.editName = this.selected;
    const d = this.detail;
    this.editType = coalesce(d.Type, d.type, 'Java');
    this.editPort = this.num(coalesce(d.Port, d.port));
    this.editBind = coalesce(d.BindToIPAddress, d.bindToIPAddress, '');
    this.editResource = coalesce(d.Resource, d.resource, '');
    this.editConnTimeout = this.num(coalesce(d.ConnectionTimeout, d.connectionTimeout));
    this.editInitTimeout = this.num(coalesce(d.InitializationTimeout, d.initializationTimeout));
    this.editSharedMem = this.truthy(d.UseSharedMemory, d.useSharedMemory);
    this.editSslServer = coalesce(d.SSLConfigurationServer, d.sslConfigurationServer, '');
    this.editSslClient = coalesce(d.SSLConfigurationClient, d.sslConfigurationClient, '');
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
  }

  async saveEdit(): Promise<void> {
    const name = this.editName.trim();
    if (!name) { this.error = this.t('lang.nameRequired'); return; }
    if (this.editMode === 'create' && this.editPort === null) { this.error = this.t('lang.portRequired'); return; }
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const body: any = {};
      body.Type = this.editType;
      if (this.editPort !== null) body.Port = this.editPort;
      if (this.editBind) body.BindToIPAddress = this.editBind;
      if (this.editResource) body.Resource = this.editResource;
      if (this.editConnTimeout !== null) body.ConnectionTimeout = this.editConnTimeout;
      if (this.editInitTimeout !== null) body.InitializationTimeout = this.editInitTimeout;
      body.UseSharedMemory = this.editSharedMem;
      if (this.editSslServer) body.SSLConfigurationServer = this.editSslServer;
      if (this.editSslClient) body.SSLConfigurationClient = this.editSslClient;
      await this.admin.client.domains.extLang.upsert(name, body);
      this.notice = this.t('lang.saved') + ' ' + name;
      this.editOpen = false;
      await this.load();
      this.selectServer(name);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- delete (DANGEROUS: double-confirm) ----------------------------------

  armDelete(): void {
    if (!this.selected) return;
    this.deleteArmed = true;
  }

  cancelDelete(): void {
    this.deleteArmed = false;
  }

  async doDelete(): Promise<void> {
    if (!this.selected || !this.deleteArmed || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const name = this.selected;
      await this.admin.client.domains.extLang.remove(name);
      this.notice = this.t('lang.deleted') + ' ' + name;
      this.deleteArmed = false;
      this.selected = '';
      this.detail = null;
      this.activity = null;
      this.running = false;
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }
}
