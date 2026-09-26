import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { I18nService } from '../core/i18n.service';
import { coalesce } from '../core/coalesce';

/**
 * WQM (Work Queue Management) categories — the worker pools that service
 * work-group requests: list, detail, create/edit, delete.
 *
 * Verified shapes (live-probed, the OpenAPI spec is broken):
 * - GET    /v2/wqm-categories  → list [{Name, MaxActiveWorkers, DefaultWorkers,
 *                                  MaxWorkers, MaxTotalWorkers, AlwaysQueue}]
 * - GET    /v2/wqm-category    param=name → {DefaultWorkers, MaxActiveWorkers,
 *                                  MaxWorkers, MaxTotalWorkers, AlwaysQueue}
 * - PUT    /v2/wqm-category    body requires `name` (+ the setting fields)
 * - DELETE /v2/wqm-category    param=name
 */
@Component({
  selector: 'app-wqm',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('wqm.title') }}</h2>
          <p class="muted">{{ t('wqm.subtitle') }}</p>
        </div>
        <div class="toolbar"><button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button></div>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (notice) { <div class="card"><p class="notice">{{ notice }}</p></div> }

      <div class="grid cols-2">
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('wqm.list') }}</h2>
            <span class="spacer"></span>
            <span class="muted">{{ rows.length }}</span>
            @if (canManage) { <button class="ghost" (click)="newEdit()">{{ t('wqm.new') }}</button> }
          </div>
          @if (rows.length) {
            <table>
              <thead>
                <tr>
                  <th>{{ t('wqm.col.name') }}</th>
                  <th>{{ t('wqm.col.maxActive') }}</th>
                  <th>{{ t('wqm.col.default') }}</th>
                  <th>{{ t('wqm.col.max') }}</th>
                  <th>{{ t('wqm.col.maxTotal') }}</th>
                  <th>{{ t('wqm.col.alwaysQueue') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows; track row.name) {
                  <tr (click)="selectCategory(row.name)" [style.background]="selected === row.name ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ row.name }}</td>
                    <td>{{ row.maxActive }}</td>
                    <td>{{ row.defaultWorkers }}</td>
                    <td>{{ row.maxWorkers }}</td>
                    <td>{{ row.maxTotal }}</td>
                    <td>{{ row.alwaysQueue }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('wqm.listEmpty') }}</p> }
        </div>

        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('wqm.detail') }}</h2>
            <span class="spacer"></span>
            <button class="ghost" (click)="loadDetail()" [disabled]="busy">{{ t('common.refresh') }}</button>
          </div>
          @if (!selected) {
            <p class="empty">{{ t('wqm.detailSelect') }}</p>
          } @else {
            <p class="muted mono">{{ selected }}</p>
            @if (canManage) {
              <div class="toolbar" style="margin:8px 0">
                <button class="ghost" (click)="editFromDetail()">{{ t('wqm.edit') }}</button>
                <button class="ghost danger" (click)="deleteCategory()" [disabled]="busy">{{ t('common.delete') }}</button>
              </div>
            }
            @if (detailRows.length) {
              <table>
                <tbody>
                  @for (row of detailRows; track row.key) {
                    <tr><th>{{ row.label }}</th><td class="mono small">{{ row.value }}</td></tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('wqm.detailEmpty') }}</p> }
          }

          @if (canManage) {
            <h3 style="margin-top:14px">{{ t('wqm.form') }}</h3>
            <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
              <input [(ngModel)]="editName" [placeholder]="t('wqm.formNamePh')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editMaxActive" type="number" [placeholder]="t('wqm.formMaxActivePh')" style="width:130px" />
              <input [(ngModel)]="editDefault" type="number" [placeholder]="t('wqm.formDefaultPh')" style="width:130px" />
              <input [(ngModel)]="editMax" type="number" [placeholder]="t('wqm.formMaxPh')" style="width:130px" />
              <input [(ngModel)]="editMaxTotal" type="number" [placeholder]="t('wqm.formMaxTotalPh')" style="width:130px" />
              <label class="small" style="display:flex;align-items:center;gap:6px"><input type="checkbox" [(ngModel)]="editAlwaysQueue" /> {{ t('wqm.formAlwaysQueue') }}</label>
            </div>
            <p class="muted small">{{ t('wqm.hint') }}</p>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="saveCategory()" [disabled]="busy || !editName">{{ t('wqm.save') }}</button>
              <button class="ghost" (click)="newEdit()">{{ t('common.cancel') }}</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class WqmComponent implements OnInit {
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

  categories: any[] = [];
  rows: { name: string; maxActive: string; defaultWorkers: string; maxWorkers: string; maxTotal: string; alwaysQueue: string }[] = [];
  selected = '';
  detail: any = null;
  detailRows: { key: string; label: string; value: string }[] = [];

  editName = '';
  editMaxActive = '';
  editDefault = '';
  editMax = '';
  editMaxTotal = '';
  editAlwaysQueue = false;

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    await this.loadCategories();
    this.loading = false;
  }

  async loadCategories(): Promise<void> {
    const list = await this.admin.client.domains.wqm.listCategories().catch(() => []);
    this.categories = Array.isArray(list) ? list : [];
    this.rows = this.categories.map((c) => this.toRow(c));
  }

  selectCategory(name: string): void {
    this.selected = name;
    this.detail = null;
    this.detailRows = [];
    this.newEdit();
    this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    if (!this.selected) return;
    this.detail = await this.admin.client.domains.wqm.getCategory(this.selected).catch(() => null);
    this.detailRows = this.toDetailRows(this.detail);
  }

  newEdit(): void {
    this.editName = '';
    this.editMaxActive = '';
    this.editDefault = '';
    this.editMax = '';
    this.editMaxTotal = '';
    this.editAlwaysQueue = false;
  }

  /** Prefill the create/edit form from the loaded detail. */
  editFromDetail(): void {
    const d = this.detail || {};
    this.editName = this.selected;
    this.editMaxActive = this.pickString(d.MaxActiveWorkers, d.maxActiveWorkers);
    this.editDefault = this.pickString(d.DefaultWorkers, d.defaultWorkers);
    this.editMax = this.pickString(d.MaxWorkers, d.maxWorkers);
    this.editMaxTotal = this.pickString(d.MaxTotalWorkers, d.maxTotalWorkers);
    const aq = d.AlwaysQueue !== undefined && d.AlwaysQueue !== null ? d.AlwaysQueue : d.alwaysQueue;
    this.editAlwaysQueue = aq === true || aq === 'true' || aq === 1 || aq === '1';
  }

  async saveCategory(): Promise<void> {
    const name = this.editName.trim();
    if (!name || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const body: Record<string, unknown> = {
        // The live API requires the body field `name` (an empty-body 400
        // reveals it); keep the canonical `Name` as well so both create and
        // edit are accepted.
        name,
        Name: name,
      };
      const maxActive = this.toNumber(this.editMaxActive);
      if (maxActive !== undefined) body.MaxActiveWorkers = maxActive;
      const def = this.toNumber(this.editDefault);
      if (def !== undefined) body.DefaultWorkers = def;
      const max = this.toNumber(this.editMax);
      if (max !== undefined) body.MaxWorkers = max;
      const maxTotal = this.toNumber(this.editMaxTotal);
      if (maxTotal !== undefined) body.MaxTotalWorkers = maxTotal;
      body.AlwaysQueue = this.editAlwaysQueue;
      await this.admin.client.domains.wqm.upsertCategory(name, body);
      this.notice = this.t('wqm.saved') + ' ' + name;
      await this.loadCategories();
      this.selected = name;
      await this.loadDetail();
      this.newEdit();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async deleteCategory(): Promise<void> {
    if (!this.selected || this.busy) return;
    // DANGEROUS op — double confirm.
    if (!window.confirm(this.t('wqm.confirmDelete') + ' ' + this.selected + ' ?')) return;
    if (!window.confirm(this.t('wqm.confirmDelete2'))) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.wqm.removeCategory(this.selected);
      this.notice = this.t('wqm.deleted') + ' ' + this.selected;
      this.selected = '';
      this.detail = null;
      this.detailRows = [];
      this.newEdit();
      await this.loadCategories();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- helpers (normalize in TS, not the template) ---

  private toNumber(v: string): number | undefined {
    const s = v.trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  }

  private pickString(a: unknown, b: unknown): string {
    const v = a !== undefined && a !== null ? a : b;
    return v === undefined || v === null ? '' : String(v);
  }

  /** Render a boolean-ish API value as on/off (API may send 0/1 or "true"). */
  private boolText(a: unknown, b: unknown): string {
    const v = a !== undefined && a !== null ? a : b;
    if (v === true || v === 'true' || v === 1 || v === '1') return this.t('common.on');
    if (v === false || v === 'false' || v === 0 || v === '0') return this.t('common.off');
    return this.pickString(v, v);
  }

  private toRow(c: any): { name: string; maxActive: string; defaultWorkers: string; maxWorkers: string; maxTotal: string; alwaysQueue: string } {
    return {
      name: this.pickString(c.Name, c.name),
      maxActive: this.pickString(c.MaxActiveWorkers, c.maxActiveWorkers),
      defaultWorkers: this.pickString(c.DefaultWorkers, c.defaultWorkers),
      maxWorkers: this.pickString(c.MaxWorkers, c.maxWorkers),
      maxTotal: this.pickString(c.MaxTotalWorkers, c.maxTotalWorkers),
      alwaysQueue: this.boolText(c.AlwaysQueue, c.alwaysQueue),
    };
  }

  /** The verified detail shape, as [label, value] rows for a key/value table. */
  private toDetailRows(d: any): { key: string; label: string; value: string }[] {
    if (!d || typeof d !== 'object') return [];
    const rows: { key: string; label: string; value: string }[] = [];
    rows.push({ key: 'DefaultWorkers', label: this.t('wqm.col.default'), value: this.pickString(d.DefaultWorkers, d.defaultWorkers) || this.t('common.none') });
    rows.push({ key: 'MaxActiveWorkers', label: this.t('wqm.col.maxActive'), value: this.pickString(d.MaxActiveWorkers, d.maxActiveWorkers) || this.t('common.none') });
    rows.push({ key: 'MaxWorkers', label: this.t('wqm.col.max'), value: this.pickString(d.MaxWorkers, d.maxWorkers) || this.t('common.none') });
    rows.push({ key: 'MaxTotalWorkers', label: this.t('wqm.col.maxTotal'), value: this.pickString(d.MaxTotalWorkers, d.maxTotalWorkers) || this.t('common.none') });
    rows.push({ key: 'AlwaysQueue', label: this.t('wqm.col.alwaysQueue'), value: this.boolText(d.AlwaysQueue, d.alwaysQueue) || this.t('common.none') });
    return rows;
  }
}
