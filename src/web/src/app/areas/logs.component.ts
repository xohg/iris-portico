import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { I18nService } from '../core/i18n.service';
import { coalesce } from '../core/coalesce';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface LogEntry {
  timestamp: string;
  source: 'system' | 'audit' | 'journal';
  message: string;
  detail?: string;
}

/**
 * Log Center — three views over the sub-systems the SysAdmin API exposes:
 *
 *  - **Stream** — a unified, time-ordered view (system status + audit + journal files).
 *  - **Journal** — journal files, per-file detail + settings, an async record browser,
 *    and journal maintenance actions (switch file / switch directory / integrity check).
 *  - **Audit** — the auditing toggle, the 75+ audit event definitions, and an async
 *    record query (with purge).
 *
 * The record endpoints are the `202 + Location` async pattern: fire the task, poll
 * `GET /v2/async-result?id=...` until it finishes, then render the `Result` array.
 */
@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('logs.title') }}</h2>
          <p class="muted">{{ t('logs.subtitle') }}</p>
        </div>
      </div>

      <div class="tabbar">
        <button [class.active]="view === 'stream'" (click)="switchView('stream')">{{ t('logs.view.stream') }}</button>
        <button [class.active]="view === 'journal'" (click)="switchView('journal')">{{ t('logs.view.journal') }}</button>
        <button [class.active]="view === 'audit'" (click)="switchView('audit')">{{ t('logs.view.audit') }}</button>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <!-- STREAM (unified) -->
      @if (view === 'stream') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <select [(ngModel)]="source">
              <option value="all">{{ t('logs.source.all') }}</option>
              <option value="system">{{ t('logs.source.system') }}</option>
              <option value="audit">{{ t('logs.source.audit') }}</option>
              <option value="journal">{{ t('logs.source.journal') }}</option>
            </select>
            <input type="number" [(ngModel)]="limit" min="1" max="500" style="width:90px" />
            <button (click)="loadStream()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button>
            <button class="ghost" (click)="toggleAuto()">{{ auto ? t('logs.autoOn') : t('logs.autoOff') }}</button>
          </div>
          <p class="muted">{{ entries.length }} {{ t('logs.entries') }}</p>
          @if (entries.length) {
            <div>
              @for (e of entries; track $index) {
                <div class="log-line">
                  <span class="ts">{{ e.timestamp }}</span>
                  <span class="src" [class.system]="e.source === 'system'" [class.audit]="e.source === 'audit'" [class.journal]="e.source === 'journal'">{{ e.source }}</span>
                  <span>{{ e.message }}</span>
                  @if (e.detail) { <span class="muted">— {{ e.detail }}</span> }
                </div>
              }
            </div>
          } @else {
            <p class="empty">{{ t('logs.empty') }}</p>
          }
        </div>
      }

      <!-- JOURNAL -->
      @if (view === 'journal') {
        @if (canOperate) {
          <div class="card" style="margin-bottom:14px">
            <div class="toolbar">
              <h2 style="margin:0">{{ t('logs.journal.actions') }}</h2>
              <span class="spacer"></span>
              @if (jSwitchFileArmed) {
                <button class="ghost danger" (click)="doSwitchFile()" [disabled]="jSwitchFileBusy">{{ jSwitchFileBusy ? t('common.loading') : t('logs.journal.switchFileConfirm') }}</button>
                <button class="ghost" (click)="jSwitchFileArmed = false" [disabled]="jSwitchFileBusy">{{ t('logs.journal.cancel') }}</button>
              } @else {
                <button class="ghost danger" (click)="confirmSwitchFile()" [disabled]="jSwitchFileBusy">{{ jSwitchFileBusy ? t('common.loading') : t('logs.journal.switchFile') }}</button>
              }
              <button class="ghost" (click)="switchDir()" [disabled]="jSwitchDirBusy">{{ jSwitchDirBusy ? t('common.loading') : t('logs.journal.switchDir') }}</button>
              <button (click)="runIntegrityCheck()" [disabled]="!jSelectedFile || jIntegrityBusy">{{ jIntegrityBusy ? t('logs.journal.integrityRunning') : t('logs.journal.integrityCheck') }}</button>
            </div>
            @if (jIntegrityBusy) { <p class="muted" style="margin-top:8px">{{ t('logs.journal.integrityRunning') }}</p> }
            @if (!jIntegrityBusy && jIntegrityRows.length) {
              <table style="margin-top:8px">
                <thead><tr><th>{{ t('logs.journal.integrityCol.file') }}</th><th>{{ t('logs.journal.integrityCol.status') }}</th><th>{{ t('logs.journal.integrityCol.detail') }}</th></tr></thead>
                <tbody>
                  @for (row of jIntegrityRows; track $index) {
                    <tr>
                      <td class="mono small">{{ coalesce(row.File, row.file, row.Name, row.name) }}</td>
                      <td class="small">{{ coalesce(row.Status, row.status, row.Result, row.result) }}</td>
                      <td class="small" [title]="coalesce(row.Error, row.error, row.Message, row.message)">{{ coalesce(row.Error, row.error, row.Message, row.message) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @if (!jIntegrityBusy && !jIntegrityRows.length && jIntegrityDone) { <p class="small" style="margin-top:8px">{{ t('logs.journal.integrityDone') }}</p> }
          </div>
        }

        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('logs.journal.files') }}</h2>
              <span class="spacer"></span>
              <button (click)="loadJournal()" [disabled]="jLoading">{{ jLoading ? t('common.loading') : t('common.refresh') }}</button>
            </div>
            @if (jFiles.length) {
              <table>
                <thead><tr><th>{{ t('logs.journal.col.name') }}</th><th>{{ t('logs.journal.col.size') }}</th><th>{{ t('logs.journal.col.created') }}</th><th>{{ t('logs.journal.col.reason') }}</th></tr></thead>
                <tbody>
                  @for (f of jFiles; track coalesce(f.Name, f.name, $index)) {
                    <tr (click)="selectJournalFile(coalesce(f.Name, f.name))" [style.background]="jSelectedFile === (coalesce(f.Name, f.name)) ? 'var(--bg-elev-2)' : ''">
                      <td class="mono small" [title]="coalesce(f.Name, f.name)">{{ coalesce(f.Name, f.name) }}</td>
                      <td>{{ fmtBytes(coalesce(f.Size, f.size)) }}</td>
                      <td class="small">{{ coalesce(f.CreationTime, f.creationTime) }}</td>
                      <td class="small">{{ coalesce(f.Reason, f.reason) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('logs.journal.filesEmpty') }}</p> }
          </div>

          <div class="card">
            <h2>{{ t('logs.journal.detail') }}</h2>
            @if (!jSelectedFile) {
              <p class="empty">{{ t('logs.journal.select') }}</p>
            } @else {
              <p class="muted mono">{{ jSelectedFile }}</p>
              <div class="toolbar" style="margin:8px 0">
                <button (click)="loadJournalFileDetail()">{{ t('common.refresh') }}</button>
                <button (click)="loadJournalRecords()" [disabled]="jRecBusy">{{ jRecBusy ? t('logs.journal.recordsRunning') : t('logs.journal.browseRecords') }}</button>
              </div>
              @if (jFile) {
                <table>
                  <tbody>
                    <tr><th>{{ t('logs.journal.firstRec') }}</th><td class="mono">{{ coalesce(jFile.FirstRecordAddress, jFile.firstRecordAddress) }}</td></tr>
                    <tr><th>{{ t('logs.journal.lastRec') }}</th><td class="mono">{{ coalesce(jFile.LastRecordAddress, jFile.lastRecordAddress) }}</td></tr>
                    <tr><th>{{ t('logs.journal.fileCount') }}</th><td>{{ coalesce(jFile.FileCount, jFile.fileCount) }}</td></tr>
                    <tr><th>{{ t('logs.journal.maxSize') }}</th><td>{{ fmtBytes(coalesce(jFile.MaxSize, jFile.maxSize)) }}</td></tr>
                    <tr><th>{{ t('logs.journal.created') }}</th><td>{{ coalesce(jFile.CreationTime, jFile.creationTime) }}</td></tr>
                    <tr><th>{{ t('logs.journal.guide') }}</th><td class="mono">{{ coalesce(jFile.FileGUID, jFile.fileGUID) }}</td></tr>
                    <tr><th>{{ t('logs.journal.encKey') }}</th><td class="mono">{{ coalesce(jFile.EncryptionKeyID, jFile.encryptionKeyID) || t('common.none') }}</td></tr>
                  </tbody>
                </table>
              }
              @if (jRecBusy) { <p class="muted" style="margin-top:10px">{{ t('logs.journal.recordsRunning') }}</p> }
              @if (jRecords.length) {
                <h3 style="margin-top:14px">{{ t('logs.journal.records') }} ({{ jRecords.length }})</h3>
                <table>
                  <thead><tr><th>{{ t('logs.journal.rec.address') }}</th><th>{{ t('logs.journal.rec.type') }}</th><th>{{ t('logs.journal.rec.time') }}</th><th>{{ t('logs.journal.rec.process') }}</th><th>{{ t('logs.journal.rec.global') }}</th></tr></thead>
                  <tbody>
                    @for (r of jRecords; track coalesce(r.Address, r.address, $index)) {
                      <tr>
                        <td class="mono">{{ coalesce(r.Address, r.address) }}</td>
                        <td>{{ coalesce(r.TypeName, r.typeName) }}</td>
                        <td class="small">{{ coalesce(r.TimeStamp, r.timeStamp) }}</td>
                        <td>{{ coalesce(r.ProcessID, r.processID) }}</td>
                        <td class="mono small" [title]="coalesce(r.GlobalNode, r.globalNode)">{{ coalesce(r.GlobalNode, r.globalNode) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            }
            @if (jSettings) {
              <h3 style="margin-top:14px">{{ t('logs.journal.settings') }}</h3>
              <table>
                <tbody>
                  <tr><th>{{ t('logs.journal.set.dir') }}</th><td class="mono">{{ coalesce(jSettings.CurrentDirectory, jSettings.currentDirectory) }}</td></tr>
                  <tr><th>{{ t('logs.journal.set.fileSize') }}</th><td>{{ jSettings.FileSizeLimit }} MB</td></tr>
                  <tr><th>{{ t('logs.journal.set.daysPurge') }}</th><td>{{ jSettings.DaysBeforePurge }}</td></tr>
                  <tr><th>{{ t('logs.journal.set.backups') }}</th><td>{{ jSettings.BackupsBeforePurge }}</td></tr>
                  <tr><th>{{ t('logs.journal.set.compress') }}</th><td>{{ jSettings.CompressFiles ? t('common.on') : t('common.off') }}</td></tr>
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- AUDIT -->
      @if (view === 'audit') {
        <div class="card" style="margin-bottom:14px">
          <div class="toolbar">
            @if (canSecure) {
              <label class="toggle-label"><input type="checkbox" [(ngModel)]="aEnabled" (change)="saveAuditEnabled()" /> {{ t('logs.audit.enabled') }}</label>
              <span class="spacer"></span>
              <input type="date" [(ngModel)]="aPurgeBegin" style="width:150px" />
              <input type="date" [(ngModel)]="aPurgeEnd" style="width:150px" />
              <button class="ghost danger" (click)="purgeAudit()" [disabled]="aPurgeBusy">{{ aPurgeBusy ? t('common.loading') : t('logs.audit.purge') }}</button>
            }
            <button (click)="loadAudit()" [disabled]="aLoading">{{ aLoading ? t('common.loading') : t('common.refresh') }}</button>
          </div>
        </div>

        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('logs.audit.events') }}</h2>
              <span class="spacer"></span>
              <input [placeholder]="t('logs.audit.eventsFilter')" [(ngModel)]="aEventFilter" style="width:180px" />
            </div>
            @if (filteredAuditEvents().length) {
              <table>
                <thead><tr><th>{{ t('logs.audit.col.event') }}</th><th>{{ t('logs.audit.col.total') }}</th><th>{{ t('logs.audit.col.written') }}</th><th>{{ t('logs.audit.col.enabled') }}</th></tr></thead>
                <tbody>
                  @for (e of filteredAuditEvents(); track coalesce(e.EventName, e.eventName, $index)) {
                    <tr (click)="selectAuditEvent(e)" [style.background]="aSelectedEvent === (coalesce(e.EventName, e.eventName)) ? 'var(--bg-elev-2)' : ''">
                      <td class="mono small" [title]="coalesce(e.EventName, e.eventName)">{{ coalesce(e.EventName, e.eventName) }}</td>
                      <td>{{ coalesce(e.Total, e.total) }}</td>
                      <td>{{ coalesce(e.Written, e.written) }}</td>
                      <td><span class="badge" [class.ok]="truthy(e.Enabled, e.enabled)">{{ truthy(e.Enabled, e.enabled) ? t('common.on') : t('common.off') }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('logs.audit.eventsEmpty') }}</p> }
          </div>

          <div class="card">
            <h2>{{ t('logs.audit.detail') }}</h2>
            @if (!aSelectedEvent) {
              <p class="empty">{{ t('logs.audit.select') }}</p>
            } @else {
              <p class="muted mono">{{ aSelectedEvent }}</p>
              @if (aEvent) {
                <table>
                  <tbody>
                    <tr><th>{{ t('logs.audit.desc') }}</th><td>{{ coalesce(aEvent.Description, aEvent.description) }}</td></tr>
                    <tr><th>{{ t('logs.audit.col.enabled') }}</th><td><span class="badge" [class.ok]="truthy(aEvent.Enabled, aEvent.enabled)">{{ truthy(aEvent.Enabled, aEvent.enabled) ? t('common.on') : t('common.off') }}</span></td></tr>
                  </tbody>
                </table>
              }
              <div class="toolbar" style="margin-top:10px">
                <button (click)="loadAuditRecords()" [disabled]="aRecBusy">{{ aRecBusy ? t('logs.audit.recordsRunning') : t('logs.audit.queryRecords') }}</button>
              </div>
              @if (aRecBusy) { <p class="muted">{{ t('logs.audit.recordsRunning') }}</p> }
              @if (aRecords.length) {
                <h3 style="margin-top:14px">{{ t('logs.audit.records') }} ({{ aRecords.length }})</h3>
                <table>
                  <thead><tr><th>{{ t('logs.audit.rec.time') }}</th><th>{{ t('logs.audit.rec.event') }}</th><th>{{ t('logs.audit.rec.user') }}</th><th>{{ t('logs.audit.rec.desc') }}</th></tr></thead>
                  <tbody>
                    @for (r of aRecords; track $index) {
                      <tr>
                        <td class="small">{{ coalesce(r.TimeStamp, r.timeStamp) }}</td>
                        <td class="mono small">{{ coalesce(r.Event, r.event) }}</td>
                        <td>{{ coalesce(r.Username, r.username) }}</td>
                        <td class="small" [title]="coalesce(r.Description, r.description)">{{ coalesce(r.Description, r.description) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class LogsComponent implements OnInit, OnDestroy {
  coalesce = coalesce;
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);
  private readonly i18n = inject(I18nService);
  private timer: ReturnType<typeof setInterval> | null = null;

  t = (k: string) => this.i18n.t(k);

  view = 'stream';
  source = 'all';
  limit = 100;
  entries: LogEntry[] = [];
  loading = false;
  error = '';
  auto = false;

  // Live getters (see SystemComponent): re-evaluated each CD cycle.
  get canSecure(): boolean { return this.perms.can(PRIV.SECURE); }
  get canOperate(): boolean { return this.perms.can(PRIV.OPERATE); }

  // journal
  jFiles: any[] = [];
  jFile: any = null;
  jSettings: any = null;
  jRecords: any[] = [];
  jSelectedFile = '';
  jLoading = false;
  jRecBusy = false;

  // journal maintenance (gated on %Admin_Operate)
  jSwitchFileArmed = false;
  jSwitchFileBusy = false;
  jSwitchDirBusy = false;
  jIntegrityBusy = false;
  jIntegrityDone = false;
  jIntegrityRows: any[] = [];

  // audit
  aEnabled = false;
  aEvents: any[] = [];
  aEvent: any = null;
  aRecords: any[] = [];
  aSelectedEvent = '';
  aEventFilter = '';
  aLoading = false;
  aRecBusy = false;
  aPurgeBusy = false;
  aPurgeBegin = '';
  aPurgeEnd = '';

  ngOnInit(): void {
    this.loadStream();
  }

  ngOnDestroy(): void {
    this.toggleAuto(false);
  }

  switchView(v: 'stream' | 'journal' | 'audit'): void {
    this.view = v;
    this.error = '';
    if (v === 'stream') this.loadStream();
    else if (v === 'journal') this.loadJournal();
    else this.loadAudit();
  }

  toggleAuto(force?: boolean): void {
    const on = force ?? !this.auto;
    this.auto = on;
    if (on && !this.timer) this.timer = setInterval(() => this.loadStream(), 5000);
    else if (!on && this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  /** True when the given value (either casing) is truthy. */
  truthy(a: unknown, b: unknown): boolean {
    const v = a !== undefined && a !== null ? a : b;
    return v === true || v === 'true' || v === 'True';
  }

  /** Human-readable byte size. */
  fmtBytes(v: unknown): string {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '—';
    if (n >= 1024 * 1024 * 1024) return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
    return n + ' B';
  }

  // ---- Stream (unified) ----
  async loadStream(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const entries: LogEntry[] = [];
      const now = new Date().toISOString();
      if (this.source === 'all' || this.source === 'system') {
        try {
          const u = await this.admin.client.domains.system.mainDashboard();
          const su = (u as any)?.SystemUsage;
          const st = (u as any)?.Status;
          entries.push({ timestamp: now, source: 'system', message: this.i18n.t('logs.message.irisstatus'), detail: this.i18n.t('logs.detail.uptime') + ' ' + (st?.UpTime ?? '?') + ' · ' + this.i18n.t('logs.detail.processes') + ' ' + (su?.Processes ?? '?') });
        } catch { /* degrade */ }
      }
      if (this.source === 'all' || this.source === 'audit') {
        try {
          const r = await this.admin.client.domains.logs.listAuditRecords({ beginDateTime: daysAgo(7) });
          const recs = await this.pollTask(r.taskId);
          (Array.isArray(recs) ? recs : []).slice(0, this.limit).forEach((rec: any) => {
            entries.push({ timestamp: rec.TimeStamp ?? rec.UTCTimeStamp ?? now, source: 'audit', message: rec.Event ?? this.i18n.t('logs.message.auditevent'), detail: rec.Username ?? '' });
          });
        } catch { /* degrade */ }
      }
      if (this.source === 'all' || this.source === 'journal') {
        try {
          const files = await this.admin.client.domains.logs.listJournalFiles();
          const arr = Array.isArray(files) ? files : [];
          arr.slice(0, this.limit).forEach((f: any) => {
            entries.push({ timestamp: f.CreationTime ?? now, source: 'journal', message: this.i18n.t('logs.message.journalfile'), detail: `${f.Name ?? ''}${f.Reason ? ` (${f.Reason})` : ''}` });
          });
        } catch { /* degrade */ }
      }
      this.entries = entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.loading = false;
  }

  // ---- Journal ----
  async loadJournal(): Promise<void> {
    this.jLoading = true;
    this.error = '';
    try {
      const files = await this.admin.client.domains.logs.listJournalFiles();
      this.jFiles = Array.isArray(files) ? files : [];
      this.jSettings = await this.admin.client.domains.logs.getJournalSettings().catch(() => null);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.jLoading = false;
  }

  selectJournalFile(name: string): void {
    this.jSelectedFile = name;
    this.jFile = null;
    this.jRecords = [];
    this.jIntegrityDone = false;
    this.jIntegrityRows = [];
    this.loadJournalFileDetail();
  }

  async loadJournalFileDetail(): Promise<void> {
    if (!this.jSelectedFile) return;
    try {
      this.jFile = await this.admin.client.domains.logs.getJournalFile(this.jSelectedFile);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  /** Fire the async record-scan task, poll to completion, render the Result array. */
  async loadJournalRecords(): Promise<void> {
    if (!this.jSelectedFile || this.jRecBusy) return;
    this.jRecBusy = true;
    this.error = '';
    try {
      const r = await this.admin.client.domains.logs.listJournalRecords(this.jSelectedFile);
      const recs = await this.pollTask(r.taskId);
      this.jRecords = Array.isArray(recs) ? recs : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.jRecBusy = false;
  }

  // ---- Journal maintenance (POST /v2/journal/switch-file, switch-dir, file/integrity-check) ----

  /**
   * DANGEROUS op, double-confirmed: first click arms the button (label becomes the
   * confirm question + a cancel button appears), the second click executes.
   */
  confirmSwitchFile(): void {
    if (!this.jSwitchFileArmed) {
      this.jSwitchFileArmed = true;
      return;
    }
    this.doSwitchFile();
  }

  /** POST /v2/journal/switch-file — NO params, EXECUTES on call. */
  async doSwitchFile(): Promise<void> {
    this.jSwitchFileArmed = false;
    this.jSwitchFileBusy = true;
    this.error = '';
    try {
      await this.admin.client.domains.logs.switchFile();
      this.jIntegrityDone = false;
      this.jIntegrityRows = [];
      await this.loadJournal();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.jSwitchFileBusy = false;
  }

  /** POST /v2/journal/switch-dir — no required params (409 when only one directory). */
  async switchDir(): Promise<void> {
    if (!window.confirm(this.i18n.t('logs.journal.switchDirConfirm'))) return;
    this.jSwitchDirBusy = true;
    this.error = '';
    try {
      await this.admin.client.domains.logs.switchDir();
      this.jIntegrityDone = false;
      this.jIntegrityRows = [];
      await this.loadJournal();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.jSwitchDirBusy = false;
  }

  /**
   * POST /v2/journal/file/integrity-check {file} — async (202 + Location):
   * fire the task, poll `tasks.getAsync(taskId)`, render the Result.
   */
  async runIntegrityCheck(): Promise<void> {
    if (!this.jSelectedFile || this.jIntegrityBusy) return;
    this.jIntegrityBusy = true;
    this.jIntegrityDone = false;
    this.jIntegrityRows = [];
    this.error = '';
    try {
      const r = await this.admin.client.domains.logs.integrityCheck(this.jSelectedFile);
      const res = await this.pollTask(r.taskId);
      if (Array.isArray(res)) this.jIntegrityRows = res;
      else if (res !== null && res !== undefined) this.jIntegrityRows = [res];
      this.jIntegrityDone = true;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.jIntegrityBusy = false;
  }

  // ---- Audit ----
  async loadAudit(): Promise<void> {
    this.aLoading = true;
    this.error = '';
    try {
      const [events, enabled] = await Promise.all([
        this.admin.client.domains.logs.listAuditEvents().catch(() => []),
        this.admin.client.domains.logs.isAuditingEnabled().catch(() => null),
      ]);
      this.aEvents = Array.isArray(events) ? events : [];
      this.aEnabled = !!(enabled as any)?.Enabled;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.aLoading = false;
  }

  filteredAuditEvents(): any[] {
    if (!this.aEventFilter) return this.aEvents;
    const f = this.aEventFilter.toLowerCase();
    return this.aEvents.filter((e) => String(e.EventName ?? e.eventName ?? '').toLowerCase().includes(f));
  }

  selectAuditEvent(e: any): void {
    this.aSelectedEvent = e.EventName ?? e.eventName ?? '';
    this.aEvent = null;
    this.aRecords = [];
    const full = this.aSelectedEvent;
    const segs = full.split('/');
    const name = segs[segs.length - 1];
    const source = segs.length >= 2 ? segs[0] : '';
    const type = segs.length >= 3 ? segs[1] : '';
    this.admin.client.domains.logs.getAuditEvent(source, type, name)
      .then((r) => { this.aEvent = r; })
      .catch(() => { this.aEvent = null; });
  }

  /** Fire the async audit-record query (last 7 days), poll to completion, render. */
  async loadAuditRecords(): Promise<void> {
    if (!this.aSelectedEvent || this.aRecBusy) return;
    this.aRecBusy = true;
    this.error = '';
    try {
      const r = await this.admin.client.domains.logs.listAuditRecords({ beginDateTime: daysAgo(7), endDateTime: daysAgo(0) });
      const recs = await this.pollTask(r.taskId);
      this.aRecords = Array.isArray(recs) ? recs : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.aRecBusy = false;
  }

  async saveAuditEnabled(): Promise<void> {
    if (!this.canSecure) return;
    try {
      await this.admin.client.domains.logs.setAuditingEnabled({ Enabled: this.aEnabled });
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async purgeAudit(): Promise<void> {
    if (!this.aPurgeBegin || !this.aPurgeEnd) return;
    if (!window.confirm(this.i18n.t('logs.audit.purgeConfirm') + ' ' + this.aPurgeBegin + ' → ' + this.aPurgeEnd + ' ?')) return;
    this.aPurgeBusy = true;
    this.error = '';
    try {
      await this.admin.client.domains.logs.purgeAuditRecords({ BeginDateTime: this.aPurgeBegin, EndDateTime: this.aPurgeEnd });
      await this.loadAudit();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.aPurgeBusy = false;
  }

  /** Poll an async task until it finishes (or give up after ~30 s). Returns the Result. */
  private async pollTask(taskId: string | null): Promise<unknown> {
    if (!taskId) return null;
    for (let i = 0; i < 12; i++) {
      await sleep(2500);
      const r = await this.admin.client.domains.tasks.getAsync(taskId);
      if (r && (r.State === 'Finished' || r.State === 'Failed')) {
        if (r.State === 'Failed' && r.FailureReason) this.error = r.FailureReason;
        return (r as any).Result ?? null;
      }
    }
    return null;
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
