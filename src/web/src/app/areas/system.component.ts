import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { I18nService } from '../core/i18n.service';
import { coalesce } from '../core/coalesce';

/**
 * System Management — processes, devices, system usage, locks and databases.
 * Plus: device subtypes (list/detail/upsert/delete), device create/edit/delete,
 * rich process detail and per-lock delete.
 * List data typed loosely; rendered with real field names + coalesce.
 */
interface SubForm {
  name: string;
  rightMargin: string;
  formFeed: string;
  screenLength: string;
  backspace: string;
  cursorControl: string;
  eraseEol: string;
  eraseEof: string;
  zu22FormFeed: string;
  zu22Backspace: string;
}

interface DevForm {
  name: string;
  type: string;
  subType: string;
  physicalDevice: string;
  description: string;
}

function emptySubForm(): SubForm {
  return { name: '', rightMargin: '', formFeed: '', screenLength: '', backspace: '', cursorControl: '', eraseEol: '', eraseEof: '', zu22FormFeed: '', zu22Backspace: '' };
}

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('system.title') }}</h2>
          <p class="muted">{{ t('system.subtitle') }}</p>
        </div>
        <div class="toolbar"><button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button></div>
      </div>
      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <div class="card">
        <h2>{{ t('system.processes') }}</h2>
        <table>
          <thead><tr><th>{{ t('system.processes.col.pid') }}</th><th>{{ t('system.processes.col.command') }}</th><th>{{ t('system.processes.col.state') }}</th><th>{{ t('system.processes.col.commands') }}</th><th>{{ t('system.processes.col.cpu') }}</th><th></th></tr></thead>
          <tbody>
            @for (p of processes; track coalesce(p.Pid, p.PID, p.pid)) {
              <tr (click)="selectProcess(coalesce(p.Pid, p.PID, p.pid))" [style.background]="isProcessSelected(p) ? 'var(--bg-elev-2)' : ''">
                <td class="mono">{{ coalesce(p.Pid, p.PID, p.pid) }}</td>
                <td class="mono">{{ coalesce(p.Routine, p.Command, p.command) }}</td>
                <td><span class="badge" [class.ok]="coalesce(p.State, p.state)">{{ coalesce(p.State, p.state) }}</span></td>
                <td>{{ coalesce(p.Commands, p.CommandsExecuted, p.commands) }}</td>
                <td style="min-width:120px">
                  <div class="bar-row">
                    <span class="bar"><i [style.width]="cpuPct(p) + '%'"></i></span>
                    <span class="bar-val">{{ num(p.CPUTime ?? p.CpuTime) }}s</span>
                  </div>
                </td>
                <td>
                  @if (canOperate) {
                    <button class="ghost" style="padding:2px 8px" (click)="suspendProcess(coalesce(p.Pid, p.PID, p.pid))">{{ t('system.processes.btn.suspend') }}</button>
                    <button class="ghost" style="padding:2px 8px" (click)="resumeProcess(coalesce(p.Pid, p.PID, p.pid))">{{ t('system.processes.btn.resume') }}</button>
                    <button class="ghost danger" style="padding:2px 8px" (click)="terminateProcess(coalesce(p.Pid, p.PID, p.pid))">{{ t('system.processes.btn.terminate') }}</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!processes.length) { <p class="empty">{{ t('system.processes.empty') }}</p> }
        <p class="muted small" style="margin-top:8px">{{ t('system.processDetail.select') }}</p>
        @if (canOperate) {
          <div class="card" style="margin-top:14px">
            <h3 style="margin-top:0">{{ t('system.broadcast.title') }}</h3>
            <p class="muted small">{{ t('system.broadcast.hint') }}</p>
            <div class="toolbar">
              <select [(ngModel)]="bcastPid">
                <option value="all">{{ t('system.broadcast.all') }}</option>
                @for (p of processes; track coalesce(p.Pid, p.PID, p.pid)) {
                  <option [value]="coalesce(p.Pid, p.PID, p.pid)">{{ coalesce(p.Pid, p.PID, p.pid) }}</option>
                }
              </select>
              <input [placeholder]="t('system.broadcast.placeholder')" [(ngModel)]="bcastMessage" style="flex:1" />
              <button (click)="broadcast()" [disabled]="!bcastMessage">{{ t('system.broadcast.send') }}</button>
            </div>
            @if (bcastNotice) { <p class="notice" style="margin-top:8px">{{ bcastNotice }}</p> }
          </div>
        }
      </div>

      <div class="card">
        <h2>{{ t('system.processDetail') }}</h2>
        @if (!processDetail) {
          <p class="empty">{{ t('system.processDetail.select') }}</p>
        } @else {
          <p class="muted mono">{{ coalesce(processDetail.Pid, processDetail.PID, processDetail.pid) }}</p>
          <table>
            <tbody>
              @for (r of pDetailRows; track r.k) {
                <tr><th>{{ t(r.k) }}</th><td class="mono small">{{ r.v }}</td></tr>
              }
            </tbody>
          </table>
        }
      </div>

      <div class="grid cols-2">
        <div class="card">
          <h2>{{ t('system.usage') }}</h2>
          @if (usage) {
            <div class="grid cols-2" style="margin-top:8px">
              @for (u of usageRows; track u.k) {
                <div class="stat"><span class="value">{{ u.v }}</span><span class="label">{{ t(u.k) }}</span></div>
              }
            </div>
            @if (usage.LastUpdate) { <p class="muted small" style="margin-top:10px">{{ t('system.usage.lastUpdate') }}: {{ usage.LastUpdate }}</p> }
          } @else { <p class="muted">{{ t('common.loading') }}</p> }
        </div>
        <div class="card">
          <h2>{{ t('system.devices') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadDevices()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('system.devices.col.device') }}</th><th>{{ t('system.devices.col.type') }}</th><th>{{ t('system.devices.col.subtype') }}</th><th></th></tr></thead>
            <tbody>
              @for (d of devices; track coalesce(d.Name, d.device)) {
                <tr (click)="selectDevice(coalesce(d.Name, d.device))" [style.background]="selectedDevice === (coalesce(d.Name, d.device)) ? 'var(--bg-elev-2)' : ''">
                  <td class="mono">{{ coalesce(d.Name, d.device) }}</td><td>{{ coalesce(d.Type, d.type) }}</td><td>{{ coalesce(d.SubType, d.State, d.state) }}</td>
                  <td>
                    @if (canManage) {
                      <button class="ghost danger" style="padding:2px 8px" (click)="deleteDevice(coalesce(d.Name, d.device))">{{ t(deviceDeleteLabel(coalesce(d.Name, d.device))) }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!devices.length) { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      </div>

      <div class="grid cols-2">
        <div class="card">
          <h2>{{ t('system.sharedMem') }}</h2>
          @if (sharedMem.length) {
            @if (sharedMemTotal) {
              <div class="bar-row" style="margin-bottom:12px">
                <span class="muted small" style="width:110px">{{ t('system.sharedMem.total') }}</span>
                <span class="bar"><i [style.width]="sharedMemPct + '%'"></i></span>
                <span class="bar-val">{{ num(sharedMemTotal.SMHUsed) }} / {{ num(sharedMemTotal.SMHAllocated) }}</span>
              </div>
            }
            <table>
              <thead><tr><th>{{ t('system.sharedMem.col.desc') }}</th><th>SMH</th><th>SMT</th><th>GST</th><th>{{ t('system.sharedMem.col.all') }}</th></tr></thead>
              <tbody>
                @for (m of sharedMemVisible; track coalesce(m.Description, m.description)) {
                  <tr [style.background]="isTotalRow(m) ? 'var(--bg-elev-2)' : ''">
                    <td>{{ coalesce(m.Description, m.description) }}</td>
                    <td style="min-width:130px">
                      <div class="bar-row">
                        <span class="bar"><i [style.width]="smhPct(m) + '%'"></i></span>
                        <span class="bar-val">{{ num(m.SMHUsed) }} / {{ num(m.SMHAllocated) }}</span>
                      </div>
                    </td>
                    <td>{{ num(m.SMTUsed) }}</td>
                    <td>{{ num(m.GSTUsed) }}</td>
                    <td>{{ num(m.AllUsed) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('common.none') }}</p> }
        </div>
        <div class="card">
          <h2>{{ t('system.sems') }}</h2>
          @if (semaphores.length) {
            <p class="muted small">{{ t('system.sems.active') }}: {{ semaphores.length }} / {{ semTotal }}</p>
            <table>
              <thead><tr><th>{{ t('system.sems.col.name') }}</th><th>Seize</th><th>Aseize</th><th>Bseize</th><th>Busy</th></tr></thead>
              <tbody>
                @for (s of semaphores; track coalesce(s.Name, s.name)) {
                  <tr>
                    <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                    <td>{{ num(s.Seize) }}</td>
                    <td>{{ num(s.Aseize) }}</td>
                    <td>{{ num(s.Bseize) }}</td>
                    <td>{{ num(s.BusySet) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      </div>

      <div class="grid cols-2">
        <div class="card">
          <h2>{{ t('system.deviceDetail') }}</h2>
          @if (!deviceDetail) {
            <p class="empty">{{ t('system.deviceDetail.select') }}</p>
          } @else {
            <p class="muted mono">{{ coalesce(deviceDetail.Name, deviceDetail.device) }}</p>
            <table>
              <tbody>
                <tr><th>{{ t('system.deviceDetail.type') }}</th><td>{{ coalesce(deviceDetail.Type, deviceDetail.type) }}</td></tr>
                <tr><th>{{ t('system.deviceDetail.subtype') }}</th><td>{{ coalesce(deviceDetail.SubType, deviceDetail.State, deviceDetail.state) }}</td></tr>
                <tr><th>{{ t('system.deviceDetail.status') }}</th><td>{{ coalesce(deviceDetail.Status, deviceDetail.status) }}</td></tr>
                <tr><th>{{ t('system.deviceDetail.description') }}</th><td>{{ coalesce(deviceDetail.Description, deviceDetail.description) }}</td></tr>
              </tbody>
            </table>
          }
        </div>
        <div class="card">
          <h2>{{ t('system.deviceSettings') }}</h2>
          <div class="toolbar" style="margin:8px 0">
            <button (click)="loadDeviceSettings()">{{ t('common.refresh') }}</button>
          </div>
          @if (deviceSettings) {
            <div class="grid cols-2">
              <div>
                <h3>{{ t('system.deviceSettings.io') }}</h3>
                <table>
                  <tbody>
                    @for (row of settingsRows(pickSettings(deviceSettings, 'IOSettings', 'ioSettings')); track $index) {
                      <tr><th>{{ row[0] }}</th><td class="mono small">{{ row[1] }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
              <div>
                <h3>{{ t('system.deviceSettings.telnet') }}</h3>
                <table>
                  <tbody>
                    @for (row of settingsRows(pickSettings(deviceSettings, 'TelnetSettings', 'telnetSettings')); track $index) {
                      <tr><th>{{ row[0] }}</th><td class="mono small">{{ row[1] }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else { <p class="empty">{{ t('common.loading') }}</p> }
        </div>
      </div>

      @if (canManage) {
        <div class="card">
          <h2>{{ t('system.deviceCreate') }}</h2>
          <p class="muted small">{{ t('system.deviceCreate.dangerNote') }}</p>
          <div class="grid cols-2" style="margin-top:8px">
            <div><span class="label">{{ t('system.deviceCreate.name') }}</span><input [(ngModel)]="devForm.name" /></div>
            <div><span class="label">{{ t('system.deviceCreate.type') }}</span><input [(ngModel)]="devForm.type" placeholder="TRM | SPL | MT | BT | IPC | OTH" /></div>
            <div><span class="label">{{ t('system.deviceCreate.subtype') }}</span><input [(ngModel)]="devForm.subType" /></div>
            <div><span class="label">{{ t('system.deviceCreate.physical') }}</span><input [(ngModel)]="devForm.physicalDevice" /></div>
            <div style="grid-column:1 / 3"><span class="label">{{ t('system.deviceCreate.description') }}</span><input [(ngModel)]="devForm.description" /></div>
          </div>
          <div class="toolbar" style="margin-top:8px">
            <button (click)="saveDevice()" [disabled]="!devForm.name">{{ t('system.deviceCreate.save') }}</button>
          </div>
          @if (devNotice) { <p class="notice" style="margin-top:8px">{{ devNotice }}</p> }
        </div>

        <div class="grid cols-2">
          <div class="card">
            <h2>{{ t('system.subtypes') }}</h2>
            <div class="toolbar" style="margin:8px 0"><button (click)="loadSubtypes()">{{ t('common.refresh') }}</button></div>
            <table>
              <thead>
                <tr>
                  <th>{{ t('system.subtypes.col.name') }}</th>
                  <th>{{ t('system.subtypes.col.rightMargin') }}</th>
                  <th>{{ t('system.subtypes.col.formFeed') }}</th>
                  <th>{{ t('system.subtypes.col.screenLength') }}</th>
                  <th>{{ t('system.subtypes.col.backspace') }}</th>
                  <th>{{ t('system.subtypes.col.cursorControl') }}</th>
                  <th>{{ t('system.subtypes.col.eraseEol') }}</th>
                  <th>{{ t('system.subtypes.col.eraseEof') }}</th>
                  <th>{{ t('system.subtypes.col.zu22FormFeed') }}</th>
                  <th>{{ t('system.subtypes.col.zu22Backspace') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (s of subtypes; track coalesce(s.Name, s.name)) {
                  <tr (click)="selectSubtype(coalesce(s.Name, s.name))" [style.background]="selectedSubtype === (coalesce(s.Name, s.name)) ? 'var(--bg-elev-2)' : ''">
                    <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                    <td>{{ coalesce(s.RightMargin, '—') }}</td>
                    <td class="mono">{{ coalesce(s.FormFeed, '—') }}</td>
                    <td>{{ coalesce(s.ScreenLength, '—') }}</td>
                    <td class="mono">{{ coalesce(s.Backspace, '—') }}</td>
                    <td class="mono">{{ coalesce(s.CursorControl, '—') }}</td>
                    <td class="mono">{{ coalesce(s.EraseEOL, '—') }}</td>
                    <td class="mono">{{ coalesce(s.EraseEOF, '—') }}</td>
                    <td class="mono">{{ coalesce(s.ZU22FormFeed, '—') }}</td>
                    <td class="mono">{{ coalesce(s.ZU22Backspace, '—') }}</td>
                    <td>
                      <button class="ghost danger" style="padding:2px 8px" (click)="deleteSubtype(coalesce(s.Name, s.name))">{{ t(subDeleteLabel(coalesce(s.Name, s.name))) }}</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            @if (!subtypes.length) { <p class="empty">{{ t('system.subtypes.empty') }}</p> }
          </div>
          <div class="card">
            <h2>{{ t('system.subtypes.edit') }}</h2>
            @if (subForm.name) {
              <div class="grid cols-2" style="margin-top:8px">
                <div><span class="label">{{ t('system.subtypes.name') }}</span><input [(ngModel)]="subForm.name" /></div>
                <div><span class="label">{{ t('system.subtypes.col.rightMargin') }}</span><input [(ngModel)]="subForm.rightMargin" /></div>
                <div><span class="label">{{ t('system.subtypes.col.formFeed') }}</span><input [(ngModel)]="subForm.formFeed" /></div>
                <div><span class="label">{{ t('system.subtypes.col.screenLength') }}</span><input [(ngModel)]="subForm.screenLength" /></div>
                <div><span class="label">{{ t('system.subtypes.col.backspace') }}</span><input [(ngModel)]="subForm.backspace" /></div>
                <div><span class="label">{{ t('system.subtypes.col.cursorControl') }}</span><input [(ngModel)]="subForm.cursorControl" /></div>
                <div><span class="label">{{ t('system.subtypes.col.eraseEol') }}</span><input [(ngModel)]="subForm.eraseEol" /></div>
                <div><span class="label">{{ t('system.subtypes.col.eraseEof') }}</span><input [(ngModel)]="subForm.eraseEof" /></div>
                <div><span class="label">{{ t('system.subtypes.col.zu22FormFeed') }}</span><input [(ngModel)]="subForm.zu22FormFeed" /></div>
                <div><span class="label">{{ t('system.subtypes.col.zu22Backspace') }}</span><input [(ngModel)]="subForm.zu22Backspace" /></div>
              </div>
              <div class="toolbar" style="margin-top:8px">
                <button (click)="saveSubtype()" [disabled]="!subForm.name">{{ t('system.subtypes.save') }}</button>
              </div>
              @if (subNotice) { <p class="notice" style="margin-top:8px">{{ subNotice }}</p> }
            } @else {
              <p class="empty">{{ t('system.subtypes.select') }}</p>
            }
          </div>
        </div>
      }

      <div class="grid cols-2">
        <div class="card">
          <h2>{{ t('system.locks') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadLocks()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead>
              <tr>
                <th>{{ t('system.locks.col.reference') }}</th>
                <th>{{ t('system.locks.col.owner') }}</th>
                <th>{{ t('system.locks.col.mode') }}</th>
                <th>@if (canOperate) { {{ t('system.locks.delete') }} }</th>
              </tr>
            </thead>
            <tbody>
              @for (l of locks; track $index) {
                <tr>
                  <td class="mono">{{ coalesce(l.Reference, l.Resource, l.resource) }}</td>
                  <td>{{ coalesce(l.OSUserName, l.Pid, l.Owner, l.owner) }}</td>
                  <td>{{ coalesce(l.ModeCount, l.State, l.state) }}</td>
                  <td>
                    @if (canOperate) {
                      <button class="ghost danger" style="padding:2px 8px" (click)="deleteLock(lockIdOf(l))">{{ t(lockDeleteLabel(l)) }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!locks.length) { <p class="empty">{{ t('common.none') }}</p> }
          @if (lockNotice) { <p class="notice" style="margin-top:8px">{{ lockNotice }}</p> }
        </div>
        <div class="card">
          <h2>{{ t('system.databases') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadDatabases()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('system.databases.col.name') }}</th><th>{{ t('system.databases.col.directory') }}</th><th>{{ t('system.databases.col.status') }}</th></tr></thead>
            <tbody>
              @for (d of databases; track coalesce(d.Name, d.name)) {
                <tr><td class="mono">{{ coalesce(d.Name, d.name) }}</td><td class="mono">{{ coalesce(d.Directory, d.directory) }}</td><td>{{ coalesce(d.Status, d.Size, d.size) }}</td></tr>
              }
            </tbody>
          </table>
          @if (!databases.length) { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      </div>
    </div>
  `,
})
export class SystemComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  processes: any[] = [];
  devices: any[] = [];
  usage: any = null;
  locks: any[] = [];
  databases: any[] = [];
  sharedMem: any[] = [];
  semaphores: any[] = [];
  semTotal = 0;
  loading = false;
  error = '';

  // Live getters: re-evaluated each CD cycle so they pick up privileges once
  // /info resolves (a full-page reload restores auth before /info completes).
  get canOperate(): boolean { return this.perms.can(PRIV.OPERATE); }
  get canManage(): boolean { return this.perms.can(PRIV.MANAGE); }

  // device detail + settings
  selectedDevice = '';
  deviceDetail: any = null;
  deviceSettings: any = null;

  // broadcast
  bcastPid = 'all';
  bcastMessage = '';
  bcastNotice = '';

  // process detail
  selectedProcess = '';
  processDetail: any = null;
  pDetailRows: { k: string; v: string }[] = [];

  // device subtypes
  subtypes: any[] = [];
  selectedSubtype = '';
  subtypeDetail: any = null;
  subForm: SubForm = emptySubForm();
  subConfirm = '';
  subNotice = '';

  // device create/edit
  devForm: DevForm = { name: '', type: '', subType: '', physicalDevice: '', description: '' };
  devDeleteTarget = '';
  devDeleteStep = 0;
  devNotice = '';

  // lock release
  lockConfirm = '';
  lockNotice = '';

  ngOnInit(): void {
    this.load();
    this.loadDeviceSettings();
    this.loadSubtypes();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const l = await this.admin.client.domains.system.listProcesses();
      this.processes = Array.isArray(l) ? l : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    await Promise.all([this.loadDevices(), this.loadUsage(), this.loadLocks(), this.loadDatabases(), this.loadSharedMem(), this.loadSemaphores()]);
    this.loading = false;
  }

  async loadSharedMem(): Promise<void> {
    try {
      const r = await this.admin.client.domains.system.sharedMemoryUsage();
      this.sharedMem = Array.isArray(r) ? r : [];
    } catch { this.sharedMem = []; }
  }

  async loadSemaphores(): Promise<void> {
    try {
      const r = await this.admin.client.domains.system.systemResources();
      const list = Array.isArray(r) ? r : [];
      this.semTotal = list.length;
      // Show only the semaphores that actually have activity.
      this.semaphores = list.filter(
        (s) => this.num(s.Seize) > 0 || this.num(s.Aseize) > 0 || this.num(s.Bseize) > 0 || this.num(s.BusySet) > 0,
      );
    } catch { this.semaphores = []; this.semTotal = 0; }
  }

  async loadDevices(): Promise<void> {
    try { const l = await this.admin.client.domains.system.listDevices(); this.devices = Array.isArray(l) ? l : []; }
    catch { this.devices = []; }
  }
  async loadUsage(): Promise<void> {
    try { this.usage = await this.admin.client.domains.system.systemUsage(); }
    catch { this.usage = null; }
  }
  async loadLocks(): Promise<void> {
    try { const l = await this.admin.client.domains.system.listLocks(); this.locks = Array.isArray(l) ? l : []; }
    catch { this.locks = []; }
  }
  async loadDatabases(): Promise<void> {
    try { const l = await this.admin.client.domains.system.listDatabases(); this.databases = Array.isArray(l) ? l : []; }
    catch { this.databases = []; }
  }
  async loadSubtypes(): Promise<void> {
    try { const l = await this.admin.client.domains.system.listDeviceSubTypes(); this.subtypes = Array.isArray(l) ? l : []; }
    catch { this.subtypes = []; }
  }

  async suspendProcess(pid: number): Promise<void> {
    try { await this.admin.client.domains.system.suspendProcess(pid); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async resumeProcess(pid: number): Promise<void> {
    try { await this.admin.client.domains.system.resumeProcess(pid); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async terminateProcess(pid: number): Promise<void> {
    try { await this.admin.client.domains.system.terminateProcess(pid); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  /** Click a process row: load the rich detail (query param is `id`, NOT `pid`). */
  selectProcess(id: number | string): void {
    const n = Number(id);
    if (!Number.isFinite(n)) return;
    this.selectedProcess = String(n);
    this.processDetail = null;
    this.pDetailRows = [];
    this.admin.client.domains.system.getProcess(n)
      .then((r) => { this.processDetail = r; this.pDetailRows = this.buildProcessRows(r); })
      .catch(() => { this.processDetail = null; });
  }

  isProcessSelected(p: any): boolean {
    const id = coalesce(p?.Pid, p?.PID, p?.pid);
    return id !== null && id !== undefined && String(id) === this.selectedProcess;
  }

  /** Key/value rows for the process detail table (label = i18n key, value = normalized). */
  buildProcessRows(d: any): { k: string; v: string }[] {
    const list = (v: unknown): string => {
      if (Array.isArray(v)) return v.join(', ');
      if (v === null || v === undefined || v === '') return '—';
      return String(v);
    };
    return [
      { k: 'system.processDetail.username', v: list(coalesce(d?.UserName, d?.Username, d?.User)) },
      { k: 'system.processDetail.state', v: list(coalesce(d?.State, d?.Status)) },
      { k: 'system.processDetail.routine', v: list(coalesce(d?.Routine, d?.CurrentLineAndRoutine, d?.CurrentSrcLine)) },
      { k: 'system.processDetail.cpuTime', v: list(coalesce(d?.CPUTime, d?.CpuTime)) },
      { k: 'system.processDetail.memoryUsed', v: list(d?.MemoryUsed) },
      { k: 'system.processDetail.memoryPeak', v: list(d?.MemoryPeak) },
      { k: 'system.processDetail.globalRefs', v: list(d?.GlobalReferences) },
      { k: 'system.processDetail.globalUpdates', v: list(d?.GlobalUpdates) },
      { k: 'system.processDetail.inTransaction', v: list(d?.InTransaction) },
      { k: 'system.processDetail.roles', v: list(coalesce(d?.Roles, d?.EscalatedRoles)) },
      { k: 'system.processDetail.loginRoles', v: list(d?.LoginRoles) },
      { k: 'system.processDetail.startTime', v: list(coalesce(d?.StartTimeUTC, d?.StartTime)) },
    ];
  }

  selectDevice(name: string): void {
    this.selectedDevice = name;
    this.deviceDetail = null;
    this.admin.client.domains.system.getDevice(name)
      .then((r) => { this.deviceDetail = r; })
      .catch(() => { this.deviceDetail = null; });
  }

  async loadDeviceSettings(): Promise<void> {
    try {
      this.deviceSettings = await this.admin.client.domains.system.getDeviceSettings();
    } catch { this.deviceSettings = null; }
  }

  /** Human-readable rendering of a possibly-nested settings object. */
  jsonOrNone(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v); } catch { return String(v); }
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

  async broadcast(): Promise<void> {
    if (!this.bcastMessage) return;
    this.bcastNotice = '';
    this.error = '';
    try {
      let pidList: number[] = [];
      if (this.bcastPid === 'all') {
        pidList = this.processes.map((p) => Number(p.Pid ?? p.PID ?? p.pid)).filter((n) => Number.isFinite(n));
      } else {
        pidList = [Number(this.bcastPid)];
      }
      await this.admin.client.domains.system.broadcast(this.bcastMessage, pidList);
      this.bcastNotice = this.t('system.broadcast.sent') + ' ' + pidList.length;
      this.bcastMessage = '';
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // ---- device subtypes -----------------------------------------------------

  selectSubtype(name: string): void {
    this.selectedSubtype = name;
    this.subtypeDetail = null;
    this.subConfirm = '';
    this.subNotice = '';
    this.subForm = emptySubForm();
    this.subForm.name = name;
    this.admin.client.domains.system.getDeviceSubtype(name)
      .then((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        this.subtypeDetail = r;
        this.subForm = {
          name,
          rightMargin: this.str(o.RightMargin),
          formFeed: this.str(o.FormFeed),
          screenLength: this.str(o.ScreenLength),
          backspace: this.str(o.Backspace),
          cursorControl: this.str(o.CursorControl),
          eraseEol: this.str(o.EraseEOL),
          eraseEof: this.str(o.EraseEOF),
          zu22FormFeed: this.str(o.ZU22FormFeed),
          zu22Backspace: this.str(o.ZU22Backspace),
        };
      })
      .catch(() => { this.subtypeDetail = null; });
  }

  async saveSubtype(): Promise<void> {
    const name = this.subForm.name.trim();
    if (!name) return;
    this.subNotice = '';
    this.error = '';
    try {
      // Verified: the required body field is `name` (lowercase); the 9 setting
      // fields use the list-shape casing. `Name` is sent as a harmless alias.
      await this.admin.client.domains.system.upsertDeviceSubtype({
        name,
        Name: name,
        RightMargin: this.toNum(this.subForm.rightMargin),
        FormFeed: this.subForm.formFeed || undefined,
        ScreenLength: this.toNum(this.subForm.screenLength),
        Backspace: this.subForm.backspace || undefined,
        CursorControl: this.subForm.cursorControl || undefined,
        EraseEOL: this.subForm.eraseEol || undefined,
        EraseEOF: this.subForm.eraseEof || undefined,
        ZU22FormFeed: this.subForm.zu22FormFeed || undefined,
        ZU22Backspace: this.subForm.zu22Backspace || undefined,
      });
      this.subNotice = this.t('system.subtypes.saved');
      await this.loadSubtypes();
      this.selectSubtype(name);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  /** Single confirm: first click arms, second click deletes. */
  deleteSubtype(name: string): void {
    if (!name) return;
    if (this.subConfirm !== name) { this.subConfirm = name; return; }
    this.subConfirm = '';
    this.admin.client.domains.system.removeDeviceSubtype(name)
      .then(() => {
        this.subNotice = this.t('system.subtypes.deleted');
        this.selectedSubtype = '';
        this.subtypeDetail = null;
        this.subForm = emptySubForm();
        this.loadSubtypes();
      })
      .catch((e) => { this.error = this.admin.errorMessage(e); });
  }

  subDeleteLabel(name: string): string {
    return this.subConfirm === name ? 'system.subtypes.confirmDelete' : 'system.subtypes.delete';
  }

  // ---- device create/edit/delete ------------------------------------------

  async saveDevice(): Promise<void> {
    const name = this.devForm.name.trim();
    if (!name) return;
    this.devNotice = '';
    this.devDeleteTarget = '';
    this.devDeleteStep = 0;
    this.error = '';
    try {
      // Verified: the required body field is `name` (lowercase); the device
      // fields use the type-shape casing. `Name` is sent as a harmless alias.
      await this.admin.client.domains.system.upsertDevice({
        name,
        Name: name,
        Type: this.devForm.type || undefined,
        SubType: this.devForm.subType || undefined,
        PhysicalDevice: this.devForm.physicalDevice || undefined,
        Description: this.devForm.description || undefined,
      });
      this.devNotice = this.t('system.deviceCreate.saved');
      await this.loadDevices();
      this.selectDevice(name);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  /** DANGEROUS: double-confirm — click 1 arms, click 2 warns, click 3 deletes. */
  deleteDevice(name: string): void {
    if (!name) return;
    if (this.devDeleteTarget !== name) { this.devDeleteTarget = name; this.devDeleteStep = 1; return; }
    if (this.devDeleteStep === 1) { this.devDeleteStep = 2; return; }
    this.devDeleteTarget = '';
    this.devDeleteStep = 0;
    this.admin.client.domains.system.removeDevice(name)
      .then(() => {
        this.devNotice = this.t('system.deviceCreate.deleted');
        this.selectedDevice = '';
        this.deviceDetail = null;
        this.loadDevices();
      })
      .catch((e) => { this.error = this.admin.errorMessage(e); });
  }

  deviceDeleteLabel(name: string): string {
    if (this.devDeleteTarget !== name) return 'system.deviceCreate.delete';
    return this.devDeleteStep === 2 ? 'system.deviceCreate.confirmDelete2' : 'system.deviceCreate.confirmDelete';
  }

  // ---- lock release --------------------------------------------------------

  // The release id is `DeleteID` (a string like "514000896,1,P40333"), not the
  // numeric Pid.
  lockIdOf(l: any): string {
    return this.str(coalesce(l?.DeleteID, l?.deleteId, l?.Id, l?.id, l?.Pid));
  }

  /** Single confirm: first click arms, second click releases the lock. */
  deleteLock(id: string): void {
    if (!id) return;
    if (this.lockConfirm !== id) { this.lockConfirm = id; return; }
    this.lockConfirm = '';
    this.admin.client.domains.system.releaseLock(id)
      .then(() => {
        this.lockNotice = this.t('system.locks.deleted');
        this.loadLocks();
      })
      .catch((e) => { this.error = this.admin.errorMessage(e); });
  }

  lockDeleteLabel(l: any): string {
    return this.lockConfirm === this.lockIdOf(l) ? 'system.locks.confirmDelete' : 'system.locks.delete';
  }

  // ---- usage / shared memory / semaphores ----------------------------------

  /** All system-usage counters as [labelKey, value] rows (template-safe). */
  get usageRows(): { k: string; v: string }[] {
    const u = this.usage || {};
    const row = (k: string, key: string) => ({ k, v: this.fmtNum(u[key]) });
    return [
      row('system.usage.globalRefs', 'AllGlobalReferences'),
      row('system.usage.globalUpdates', 'GlobalUpdateReferences'),
      row('system.usage.routine', 'RoutineCalls'),
      row('system.usage.routineBuffer', 'RoutineBufferLoadsAndSaves'),
      row('system.usage.blocks', 'LogicalBlockRequests'),
      row('system.usage.blockReads', 'BlockReads'),
      row('system.usage.writes', 'BlockWrites'),
      row('system.usage.wijWrites', 'WIJwrites'),
      row('system.usage.journal', 'JournalEntries'),
      row('system.usage.journalBlockWrites', 'JournalBlockWrites'),
      row('system.usage.routineLines', 'RoutineLines'),
    ];
  }

  /** Shared-memory segments worth showing (non-zero, plus the Total row). */
  get sharedMemVisible(): any[] {
    return this.sharedMem.filter((m) => this.num(m.AllUsed) > 0 || this.isTotalRow(m));
  }

  get sharedMemTotal(): any {
    return this.sharedMem.find((m) => this.isTotalRow(m)) || null;
  }

  get sharedMemPct(): number {
    const t = this.sharedMemTotal;
    const a = this.num(t?.SMHAllocated);
    const u = this.num(t?.SMHUsed);
    return a > 0 ? Math.min(100, (u / a) * 100) : (u > 0 ? 100 : 0);
  }

  isTotalRow(m: any): boolean {
    return this.str(m?.Description) === 'Total' || this.str(m?.description) === 'Total';
  }

  /** SMH used/allocated percentage for one segment (template-safe). */
  smhPct(m: any): number {
    const a = this.num(m.SMHAllocated);
    const u = this.num(m.SMHUsed);
    return a > 0 ? Math.min(100, (u / a) * 100) : (u > 0 ? 100 : 0);
  }

  /** CPU-time bar width, relative to the busiest process (template-safe). */
  cpuPct(p: any): number {
    let max = 0;
    for (const x of this.processes) max = Math.max(max, this.num(x.CPUTime ?? x.CpuTime));
    const v = this.num(p.CPUTime ?? p.CpuTime);
    return max > 0 ? Math.min(100, (v / max) * 100) : 0;
  }

  // ---- small normalizers ---------------------------------------------------

  /** Coerce to a finite number, 0 when absent. */
  num(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /** Coerce to a number and format with thousands separators, '—' when absent. */
  fmtNum(v: unknown): string {
    const n = this.num(v);
    return n ? n.toLocaleString() : '—';
  }

  private str(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v);
  }

  private toNum(s: string): number | undefined {
    const t = s.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  }
}
