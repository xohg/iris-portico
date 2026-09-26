import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { I18nService } from '../core/i18n.service';
import { coalesce } from '../core/coalesce';

/**
 * License — the instance's license key (info, validate, activate) and the
 * license servers that distribute keys (list, detail, create/edit, delete).
 *
 * Verified shapes (live-probed, the OpenAPI spec is broken):
 * - GET  /v2/license/key            → single object (key info)
 * - POST /v2/license/key/validate   body={Key}
 * - PUT  /v2/license/key            body={Key} (activate)
 * - GET  /v2/license/servers        → list [{Name, Address, Port, KeyDirectory}]
 * - GET  /v2/license/server         param=name → {Address, Port, KeyDirectory}
 * - PUT  /v2/license/server         body requires `name` (+ Address/Port/KeyDirectory)
 * - DELETE /v2/license/server       param=name
 */
@Component({
  selector: 'app-license',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('license.title') }}</h2>
          <p class="muted">{{ t('license.subtitle') }}</p>
        </div>
        <div class="toolbar"><button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button></div>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (notice) { <div class="card"><p class="muted">{{ notice }}</p></div> }

      <div class="grid cols-2">
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('license.keyInfo') }}</h2>
            <span class="spacer"></span>
            <button class="ghost" (click)="loadKeyInfo()" [disabled]="busy">{{ t('common.refresh') }}</button>
          </div>
          @if (keyInfoEntries.length) {
            <table>
              <tbody>
                @for (kv of keyInfoEntries; track $index) {
                  <tr><th>{{ kv[0] }}</th><td class="mono small">{{ kv[1] }}</td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('license.keyInfoEmpty') }}</p> }

          <h3 style="margin-top:14px">{{ t('license.keyForm') }}</h3>
          <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
            <input [(ngModel)]="keyInput" [placeholder]="t('license.keyPh')" style="flex:1;min-width:180px" />
            <button (click)="validateKey()" [disabled]="busy || !keyInput">{{ t('license.keyValidate') }}</button>
            @if (canManage) { <button class="ghost danger" (click)="activateKey()" [disabled]="busy || !keyInput">{{ t('license.keyActivate') }}</button> }
          </div>
          @if (validateResultEntries.length) {
            <table>
              <tbody>
                @for (kv of validateResultEntries; track $index) {
                  <tr><th>{{ kv[0] }}</th><td class="mono small">{{ kv[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('license.servers') }}</h2>
            <span class="spacer"></span>
            <span class="muted">{{ servers.length }}</span>
            @if (canManage) { <button class="ghost" (click)="newEdit()">{{ t('license.serverNew') }}</button> }
          </div>
          @if (servers.length) {
            <table>
              <thead>
                <tr>
                  <th>{{ t('license.serversColName') }}</th>
                  <th>{{ t('license.serversColAddress') }}</th>
                  <th>{{ t('license.serversColPort') }}</th>
                  <th>{{ t('license.serversColKeydir') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (s of servers; track coalesce(s.Name, s.name, $index)) {
                  <tr (click)="selectServer(coalesce(s.Name, s.name))" [style.background]="selected === (coalesce(s.Name, s.name)) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                    <td class="mono">{{ coalesce(s.Address, s.address) }}</td>
                    <td>{{ coalesce(s.Port, s.port) }}</td>
                    <td class="mono">{{ coalesce(s.KeyDirectory, s.keyDirectory) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('license.serversEmpty') }}</p> }

          <h3 style="margin-top:14px">{{ t('license.serverDetail') }}</h3>
          @if (!selected) {
            <p class="empty">{{ t('license.serverSelect') }}</p>
          } @else {
            <p class="muted mono">{{ selected }}</p>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="loadDetail()">{{ t('common.refresh') }}</button>
              @if (canManage) {
                <button class="ghost" (click)="editFromDetail()">{{ t('license.serverEdit') }}</button>
                <button class="ghost danger" (click)="deleteServer()" [disabled]="busy">{{ t('common.delete') }}</button>
              }
            </div>
            @if (serverDetail) {
              <table>
                <tbody>
                  <tr><th>{{ t('license.serversColAddress') }}</th><td class="mono">{{ coalesce(serverDetail.Address, serverDetail.address) || t('common.none') }}</td></tr>
                  <tr><th>{{ t('license.serversColPort') }}</th><td>{{ coalesce(serverDetail.Port, serverDetail.port) || t('common.none') }}</td></tr>
                  <tr><th>{{ t('license.serversColKeydir') }}</th><td class="mono">{{ coalesce(serverDetail.KeyDirectory, serverDetail.keyDirectory) || t('common.none') }}</td></tr>
                </tbody>
              </table>
            }
          }

          @if (canManage) {
            <h3 style="margin-top:14px">{{ t('license.serverForm') }}</h3>
            <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
              <input [(ngModel)]="editName" [placeholder]="t('license.serverFormName')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editAddress" [placeholder]="t('license.serverFormAddress')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editPort" [placeholder]="t('license.serverFormPort')" style="width:110px" />
              <input [(ngModel)]="editKeydir" [placeholder]="t('license.serverFormKeydir')" style="flex:1;min-width:140px" />
            </div>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="saveServer()" [disabled]="busy || !editName">{{ t('license.serverFormSave') }}</button>
              <button class="ghost" (click)="newEdit()">{{ t('common.cancel') }}</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class LicenseComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  // Live permission getter (re-evaluated each CD cycle — NOT computed once).
  get canManage(): boolean { return this.perms.can(PRIV.MANAGE); }

  loading = false;
  busy = false;
  error = '';
  notice = '';

  keyInfo: any = null;
  keyInfoEntries: [string, string][] = [];
  keyInput = '';
  validateResult: any = null;
  validateResultEntries: [string, string][] = [];

  servers: any[] = [];
  selected = '';
  serverDetail: any = null;

  editName = '';
  editAddress = '';
  editPort = '';
  editKeydir = '';

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    await Promise.all([this.loadKeyInfo(), this.loadServers()]);
    this.loading = false;
  }

  async loadKeyInfo(): Promise<void> {
    this.keyInfo = await this.admin.client.domains.license.getKey().catch(() => null);
    this.keyInfoEntries = this.toEntries(this.keyInfo);
  }

  async loadServers(): Promise<void> {
    const list = await this.admin.client.domains.license.listServers().catch(() => []);
    this.servers = Array.isArray(list) ? list : [];
  }

  selectServer(name: string): void {
    this.selected = name;
    this.serverDetail = null;
    this.newEdit();
    this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    if (!this.selected) return;
    this.serverDetail = await this.admin.client.domains.license.getServer(this.selected).catch(() => null);
  }

  newEdit(): void {
    this.editName = '';
    this.editAddress = '';
    this.editPort = '';
    this.editKeydir = '';
  }

  /** Prefill the create/edit form from the loaded detail. */
  editFromDetail(): void {
    const d = this.serverDetail || {};
    this.editName = this.selected;
    this.editAddress = this.pickString(d.Address, d.address);
    this.editPort = this.pickString(d.Port, d.port);
    this.editKeydir = this.pickString(d.KeyDirectory, d.keyDirectory);
  }

  async saveServer(): Promise<void> {
    const name = this.editName.trim();
    if (!name || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      // The live API requires the body field `name` (an empty-body 400 reveals
      // it); keep the canonical `Name` as well so both create and edit are
      // accepted.
      const body: Record<string, unknown> = {
        name,
        Name: name,
        Address: this.editAddress.trim(),
        KeyDirectory: this.editKeydir.trim(),
      };
      if (this.editPort.trim() !== '') body.Port = Number(this.editPort);
      await this.admin.client.domains.license.upsertServer(name, body);
      this.notice = this.t('license.serverSaved') + ' ' + name;
      await this.loadServers();
      this.selected = name;
      await this.loadDetail();
      this.newEdit();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async deleteServer(): Promise<void> {
    if (!this.selected || this.busy) return;
    // DANGEROUS op — double confirm.
    if (!window.confirm(this.t('license.serverConfirmDelete') + ' ' + this.selected + ' ?')) return;
    if (!window.confirm(this.t('license.serverConfirmDelete2'))) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.license.removeServer(this.selected);
      this.notice = this.t('license.serverDeleted') + ' ' + this.selected;
      this.selected = '';
      this.serverDetail = null;
      this.newEdit();
      await this.loadServers();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async validateKey(): Promise<void> {
    const key = this.keyInput.trim();
    if (!key || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      this.validateResult = await this.admin.client.domains.license.validateKey(key);
      this.validateResultEntries = this.toEntries(this.validateResult);
      this.notice = this.t('license.keyValidated');
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async activateKey(): Promise<void> {
    const key = this.keyInput.trim();
    if (!key || this.busy) return;
    if (!window.confirm(this.t('license.keyActivateConfirm') + ' ' + key + ' ?')) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.license.activateKey(key);
      this.notice = this.t('license.keyActivated');
      this.keyInput = '';
      this.validateResult = null;
      this.validateResultEntries = [];
      await this.loadKeyInfo();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- helpers (normalize in TS, not the template) ---

  pickString(a: unknown, b: unknown): string {
    const v = a !== undefined && a !== null ? a : b;
    return v === undefined || v === null ? '' : String(v);
  }

  /** Flatten an object into [field, string] rows for generic rendering. */
  private toEntries(o: any): [string, string][] {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return [];
    return Object.entries(o).map(([k, v]) => [k, this.formatValue(v)]);
  }

  private formatValue(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }
}
