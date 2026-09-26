import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { I18nService } from '../core/i18n.service';
import { coalesce } from '../core/coalesce';

/**
 * Namespaces — list, detail, create/edit, delete (DANGEROUS: deleting a
 * namespace removes its associated web applications), the three mapping
 * sub-views (routine / global / package), and the copy-mappings +
 * enable-interop actions.
 *
 * Verified shapes (live-probed, the OpenAPI spec is broken):
 * - GET  /v2/namespaces                → list [{Name, Globals, Routines, SysGlobals, SysRoutines, Library, TempGlobals}]
 * - GET  /v2/namespace                param=name → {Globals, Routines, TempGlobals} (arrays)
 * - PUT  /v2/namespace                body requires `name` (create/edit)
 * - DELETE /v2/namespace             param=name
 * - GET  /v2/namespace/routine-mappings · GET /v2/namespace/routine-mapping param=name · PUT/DELETE name
 * - GET  /v2/namespace/global-mappings · GET /v2/namespace/global-mapping param=name · PUT/DELETE name
 * - GET  /v2/namespace/package-mappings · GET /v2/namespace/package-mapping param=name · PUT/DELETE name
 * - POST /v2/namespace/copy-mappings   body={SourceNamespace, DestinationNamespace}
 * - POST /v2/namespace/enable-interop  body={name}
 */
@Component({
  selector: 'app-namespaces',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('namespace.title') }}</h2>
          <p class="muted">{{ t('namespace.subtitle') }}</p>
        </div>
        <div class="toolbar"><button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button></div>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (notice) { <div class="card"><p style="color:var(--ok)">{{ notice }}</p></div> }

      <div class="grid cols-2">
        <!-- LEFT: namespace list + create/edit -->
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('namespace.list') }}</h2>
            <span class="spacer"></span>
            <span class="muted">{{ namespaces.length }}</span>
            @if (canManage) { <button class="ghost" (click)="newEdit()">{{ t('namespace.new') }}</button> }
          </div>
          @if (namespaces.length) {
            <table>
              <thead>
                <tr>
                  <th>{{ t('namespace.col.name') }}</th>
                  <th>{{ t('namespace.col.globals') }}</th>
                  <th>{{ t('namespace.col.routines') }}</th>
                  <th>{{ t('namespace.col.library') }}</th>
                  <th>{{ t('namespace.col.tempGlobals') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (n of namespaces; track coalesce(n.Name, n.name, $index)) {
                  <tr (click)="selectNamespace(coalesce(n.Name, n.name))" [style.background]="selected === (coalesce(n.Name, n.name)) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(n.Name, n.name) }}</td>
                    <td class="mono">{{ coalesce(n.Globals, n.globals) }}</td>
                    <td class="mono">{{ coalesce(n.Routines, n.routines) }}</td>
                    <td class="mono">{{ coalesce(n.Library, n.library) }}</td>
                    <td class="mono">{{ coalesce(n.TempGlobals, n.tempGlobals) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('namespace.empty') }}</p> }

          @if (canManage) {
            <h3 style="margin-top:14px">{{ t('namespace.form') }}</h3>
            <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
              <input [(ngModel)]="editName" [placeholder]="t('namespace.ph.name')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editGlobals" [placeholder]="t('namespace.ph.globals')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editRoutines" [placeholder]="t('namespace.ph.routines')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editLibrary" [placeholder]="t('namespace.ph.library')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="editTempGlobals" [placeholder]="t('namespace.ph.tempGlobals')" style="flex:1;min-width:140px" />
            </div>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="saveNamespace()" [disabled]="busy || !editName">{{ t('namespace.formSave') }}</button>
              <button class="ghost" (click)="newEdit()">{{ t('common.cancel') }}</button>
            </div>
          }
        </div>

        <!-- RIGHT: detail + mappings + actions -->
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <h2 style="margin:0">{{ t('namespace.detail') }}</h2>
            <span class="spacer"></span>
            @if (canManage) {
              <button class="ghost" (click)="editFromDetail()">{{ t('namespace.edit') }}</button>
              <input [(ngModel)]="deleteConfirm" [placeholder]="t('namespace.deleteHint')" style="width:150px" />
              <button class="ghost danger" (click)="deleteNamespace()" [disabled]="busy || deleteConfirm !== selected">{{ t('common.delete') }}</button>
            }
          </div>
          @if (!selected) {
            <p class="empty">{{ t('namespace.select') }}</p>
          } @else {
            <p class="muted mono">{{ selected }}</p>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="loadDetail()">{{ t('common.refresh') }}</button>
            </div>
            @if (detail) {
              <h3>{{ t('namespace.col.globals') }}</h3>
              @if (detailGlobals.length) {
                <table><tbody>
                  @for (g of detailGlobals; track $index) { <tr><td class="mono">{{ g }}</td></tr> }
                </tbody></table>
              } @else { <p class="empty">{{ t('namespace.arrEmpty') }}</p> }
              <h3>{{ t('namespace.col.routines') }}</h3>
              @if (detailRoutines.length) {
                <table><tbody>
                  @for (r of detailRoutines; track $index) { <tr><td class="mono">{{ r }}</td></tr> }
                </tbody></table>
              } @else { <p class="empty">{{ t('namespace.arrEmpty') }}</p> }
              <h3>{{ t('namespace.col.tempGlobals') }}</h3>
              @if (detailTempGlobals.length) {
                <table><tbody>
                  @for (tg of detailTempGlobals; track $index) { <tr><td class="mono">{{ tg }}</td></tr> }
                </tbody></table>
              } @else { <p class="empty">{{ t('namespace.arrEmpty') }}</p> }
            }
          }

          <!-- mapping sub-views -->
          <h3 style="margin-top:14px">{{ t('namespace.mappings') }}</h3>
          <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
            <button class="ghost" [class.ok]="mappingTab === 'routine'" (click)="selectMappingTab('routine')">{{ t('namespace.map.routine') }}</button>
            <button class="ghost" [class.ok]="mappingTab === 'global'" (click)="selectMappingTab('global')">{{ t('namespace.map.global') }}</button>
            <button class="ghost" [class.ok]="mappingTab === 'package'" (click)="selectMappingTab('package')">{{ t('namespace.map.package') }}</button>
            <span class="spacer"></span>
            <span class="muted">{{ mappingList.length }}</span>
            @if (canManage) { <button class="ghost" (click)="newMappingEdit()">{{ t('namespace.mapNew') }}</button> }
          </div>
          @if (mappingList.length) {
            <table>
              <thead>
                <tr>
                  <th>{{ t('namespace.map.col.name') }}</th>
                  <th>{{ t('namespace.map.col.database') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (m of mappingList; track coalesce(m.Name, m.name, $index)) {
                  <tr (click)="selectMapping(coalesce(m.Name, m.name))" [style.background]="mappingSelected === (coalesce(m.Name, m.name)) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(m.Name, m.name) }}</td>
                    <td class="mono">{{ coalesce(m.Database, m.database) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('namespace.mapEmpty') }}</p> }

          <h3 style="margin-top:14px">{{ t('namespace.mapDetail') }}</h3>
          @if (!mappingSelected) {
            <p class="empty">{{ t('namespace.mapSelect') }}</p>
          } @else {
            <p class="muted mono">{{ mappingSelected }}</p>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="loadMappingDetail()">{{ t('common.refresh') }}</button>
              @if (canManage) {
                <button class="ghost" (click)="editMappingFromDetail()">{{ t('namespace.edit') }}</button>
                <button class="ghost danger" (click)="deleteMapping()" [disabled]="busy">{{ t('common.delete') }}</button>
              }
            </div>
            @if (mappingDetailEntries.length) {
              <table><tbody>
                @for (kv of mappingDetailEntries; track $index) {
                  <tr><th>{{ kv[0] }}</th><td class="mono small">{{ kv[1] }}</td></tr>
                }
              </tbody></table>
            } @else { <p class="empty">{{ t('namespace.mapDetailEmpty') }}</p> }
          }

          @if (canManage) {
            <h3 style="margin-top:14px">{{ t('namespace.mapForm') }}</h3>
            <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
              <input [(ngModel)]="mappingEditName" [placeholder]="t('namespace.mapPh.name')" style="flex:1;min-width:140px" />
              <input [(ngModel)]="mappingEditDatabase" [placeholder]="t('namespace.mapPh.database')" style="flex:1;min-width:140px" />
            </div>
            <div class="toolbar" style="margin:8px 0">
              <button (click)="saveMapping()" [disabled]="busy || !mappingEditName">{{ t('namespace.mapFormSave') }}</button>
              <button class="ghost" (click)="newMappingEdit()">{{ t('common.cancel') }}</button>
            </div>
          }

          <!-- actions -->
          <h3 style="margin-top:14px">{{ t('namespace.actions') }}</h3>
          @if (canManage) {
            <p class="muted small">{{ t('namespace.copyHint') }}</p>
            <div class="toolbar" style="margin:8px 0;flex-wrap:wrap">
              <select [(ngModel)]="copySource" style="flex:1;min-width:140px">
                <option value="">{{ t('namespace.copySelect') }}</option>
                @for (nm of namespaceNames; track nm) { <option [value]="nm">{{ nm }}</option> }
              </select>
              <select [(ngModel)]="copyDest" style="flex:1;min-width:140px">
                <option value="">{{ t('namespace.copySelect') }}</option>
                @for (nm of namespaceNames; track nm) { <option [value]="nm">{{ nm }}</option> }
              </select>
              <button (click)="copyMappings()" [disabled]="busy || !copySource || !copyDest || copySource === copyDest">{{ t('namespace.copy') }}</button>
            </div>
            <div class="toolbar" style="margin:8px 0">
              <button class="ghost" (click)="enableInterop()" [disabled]="busy || !selected" [title]="t('namespace.enableInteropHint')">{{ t('namespace.enableInterop') }}</button>
            </div>
          } @else {
            <p class="empty">{{ t('namespace.actionsNoPerm') }}</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class NamespacesComponent implements OnInit {
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

  // namespace list + detail
  namespaces: any[] = [];
  namespaceNames: string[] = [];
  selected = '';
  detail: any = null;
  detailGlobals: string[] = [];
  detailRoutines: string[] = [];
  detailTempGlobals: string[] = [];

  // create/edit namespace form
  editName = '';
  editGlobals = '';
  editRoutines = '';
  editLibrary = '';
  editTempGlobals = '';
  deleteConfirm = '';

  // mapping sub-views
  mappingTab: 'routine' | 'global' | 'package' = 'routine';
  mappingList: any[] = [];
  mappingSelected = '';
  mappingDetail: any = null;
  mappingDetailEntries: [string, string][] = [];
  mappingEditName = '';
  mappingEditDatabase = '';

  // actions
  copySource = '';
  copyDest = '';

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    await this.loadNamespaces();
    await this.loadMappingList();
    this.loading = false;
  }

  async loadNamespaces(): Promise<void> {
    const list = await this.admin.client.domains.namespaces.list().catch(() => []);
    this.namespaces = Array.isArray(list) ? list : [];
    this.namespaceNames = this.namespaces.map((n) => this.pickString(n.Name, n.name));
  }

  selectNamespace(name: string): void {
    this.selected = name;
    this.deleteConfirm = '';
    this.detail = null;
    this.detailGlobals = [];
    this.detailRoutines = [];
    this.detailTempGlobals = [];
    this.loadDetail();
  }

  async loadDetail(): Promise<void> {
    if (!this.selected) return;
    this.detail = await this.admin.client.domains.namespaces.get(this.selected).catch(() => null);
    const d = this.detail || {};
    this.detailGlobals = this.toArray(this.pick(d.Globals, d.globals));
    this.detailRoutines = this.toArray(this.pick(d.Routines, d.routines));
    this.detailTempGlobals = this.toArray(this.pick(d.TempGlobals, d.tempGlobals));
  }

  newEdit(): void {
    this.editName = '';
    this.editGlobals = '';
    this.editRoutines = '';
    this.editLibrary = '';
    this.editTempGlobals = '';
  }

  /** Prefill the create/edit form from the loaded detail. */
  editFromDetail(): void {
    const d = this.detail || {};
    this.editName = this.selected;
    this.editGlobals = this.pickString(d.Globals, d.globals);
    this.editRoutines = this.pickString(d.Routines, d.routines);
    this.editLibrary = this.pickString(d.Library, d.library);
    this.editTempGlobals = this.pickString(d.TempGlobals, d.tempGlobals);
  }

  async saveNamespace(): Promise<void> {
    const name = this.editName.trim();
    if (!name || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      // The live API requires the body field `name`; keep the canonical
      // `Name` too so both create and edit are accepted.
      const body: Record<string, unknown> = { name, Name: name };
      const g = this.editGlobals.trim();
      if (g !== '') body.Globals = g;
      const r = this.editRoutines.trim();
      if (r !== '') body.Routines = r;
      const lib = this.editLibrary.trim();
      if (lib !== '') body.Library = lib;
      const tg = this.editTempGlobals.trim();
      if (tg !== '') body.TempGlobals = tg;
      await this.admin.client.domains.namespaces.create(name, body);
      this.notice = this.t('namespace.saved') + ' ' + name;
      await this.loadNamespaces();
      this.selected = name;
      await this.loadDetail();
      this.newEdit();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  /** DANGEROUS: deleting a namespace removes its associated web applications.
   *  Gated on canManage + a typed confirmation (the user must type the exact
   *  namespace name to enable the button). */
  async deleteNamespace(): Promise<void> {
    if (!this.selected || this.busy) return;
    if (this.deleteConfirm.trim() !== this.selected) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.namespaces.remove(this.selected);
      this.notice = this.t('namespace.deleted') + ' ' + this.selected;
      this.selected = '';
      this.detail = null;
      this.detailGlobals = [];
      this.detailRoutines = [];
      this.detailTempGlobals = [];
      this.deleteConfirm = '';
      this.copySource = '';
      this.copyDest = '';
      await this.loadNamespaces();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- mapping sub-views ---

  selectMappingTab(tab: 'routine' | 'global' | 'package'): void {
    this.mappingTab = tab;
    this.mappingSelected = '';
    this.mappingDetail = null;
    this.mappingDetailEntries = [];
    this.newMappingEdit();
    this.loadMappingList();
  }

  async loadMappingList(): Promise<void> {
    // The live API requires the `namespace` query param; with no namespace
    // selected there is nothing to list (the param-less call 400s), so skip it.
    const ns = this.selected;
    if (!ns) { this.mappingList = []; return; }
    let p: Promise<unknown>;
    if (this.mappingTab === 'global') p = this.admin.client.domains.namespaces.listGlobalMappings(ns);
    else if (this.mappingTab === 'package') p = this.admin.client.domains.namespaces.listPackageMappings(ns);
    else p = this.admin.client.domains.namespaces.listRoutineMappings(ns);
    const list = await p.catch(() => []);
    this.mappingList = Array.isArray(list) ? list : [];
  }

  selectMapping(name: string): void {
    this.mappingSelected = name;
    this.mappingDetail = null;
    this.mappingDetailEntries = [];
    this.loadMappingDetail();
  }

  async loadMappingDetail(): Promise<void> {
    if (!this.mappingSelected) return;
    let p: Promise<unknown>;
    if (this.mappingTab === 'global') p = this.admin.client.domains.namespaces.getGlobalMapping(this.mappingSelected);
    else if (this.mappingTab === 'package') p = this.admin.client.domains.namespaces.getPackageMapping(this.mappingSelected);
    else p = this.admin.client.domains.namespaces.getRoutineMapping(this.mappingSelected);
    this.mappingDetail = await p.catch(() => null);
    this.mappingDetailEntries = this.toEntries(this.mappingDetail);
  }

  newMappingEdit(): void {
    this.mappingEditName = '';
    this.mappingEditDatabase = '';
  }

  /** Prefill the mapping create/edit form from the loaded detail. */
  editMappingFromDetail(): void {
    const d = this.mappingDetail || {};
    this.mappingEditName = this.mappingSelected;
    this.mappingEditDatabase = this.pickString(d.Database, d.database);
  }

  async saveMapping(): Promise<void> {
    const name = this.mappingEditName.trim();
    if (!name || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      // The live API requires the body field `name`; `Database` is the value
      // field (mirrors the MapRoutine type). Only send it when provided.
      const body: Record<string, unknown> = { name, Name: name };
      const db = this.mappingEditDatabase.trim();
      if (db !== '') body.Database = db;
      if (this.mappingTab === 'global') await this.admin.client.domains.namespaces.createGlobalMapping(name, body);
      else if (this.mappingTab === 'package') await this.admin.client.domains.namespaces.createPackageMapping(name, body);
      else await this.admin.client.domains.namespaces.createRoutineMapping(name, body);
      this.notice = this.t('namespace.mappingSaved') + ' ' + name;
      await this.loadMappingList();
      this.newMappingEdit();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async deleteMapping(): Promise<void> {
    if (!this.mappingSelected || this.busy) return;
    // DANGEROUS op — double confirm.
    if (!window.confirm(this.t('namespace.mappingConfirmDelete') + ' ' + this.mappingSelected + ' ?')) return;
    if (!window.confirm(this.t('namespace.mappingConfirmDelete2'))) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      if (this.mappingTab === 'global') await this.admin.client.domains.namespaces.removeGlobalMapping(this.mappingSelected);
      else if (this.mappingTab === 'package') await this.admin.client.domains.namespaces.removePackageMapping(this.mappingSelected);
      else await this.admin.client.domains.namespaces.removeRoutineMapping(this.mappingSelected);
      this.notice = this.t('namespace.mappingDeleted') + ' ' + this.mappingSelected;
      this.mappingSelected = '';
      this.mappingDetail = null;
      this.mappingDetailEntries = [];
      this.newMappingEdit();
      await this.loadMappingList();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- actions ---

  async copyMappings(): Promise<void> {
    const src = this.copySource.trim();
    const dest = this.copyDest.trim();
    if (!src || !dest || src === dest || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.namespaces.copyMappings({ SourceNamespace: src, DestinationNamespace: dest });
      this.notice = this.t('namespace.copyDone') + ' ' + src + ' -> ' + dest;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async enableInterop(): Promise<void> {
    if (!this.selected || this.busy) return;
    if (!window.confirm(this.t('namespace.enableInteropConfirm') + ' ' + this.selected + ' ?')) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.namespaces.enableInterop(this.selected);
      this.notice = this.t('namespace.interopEnabled') + ' ' + this.selected;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- helpers (normalize in TS, not the template) ---

  /** First non-null/undefined of two values. */
  private pick(a: unknown, b: unknown): unknown {
    return a !== undefined && a !== null ? a : b;
  }

  pickString(a: unknown, b: unknown): string {
    const v = this.pick(a, b);
    return v === undefined || v === null ? '' : String(v);
  }

  /** Coerce an API value (an array, or a comma-separated string) into string[]. */
  private toArray(v: unknown): string[] {
    if (Array.isArray(v)) return v.map((x) => String(x));
    if (typeof v === 'string' && v !== '') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
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
