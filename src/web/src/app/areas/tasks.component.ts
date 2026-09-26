import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';
import type { Task } from '@iris-portico/api-client';

/**
 * Task Management — run, schedule and control background tasks.
 * List data is typed loosely (the spec leaves some list shapes open), rendered
 * with the real field names and optional chaining for robustness.
 *
 * Extended with task CRUD + info (verified against IRIS 2026.2):
 *  - Detail:  GET  /v2/task?id=<Id>        (the numeric `Id` list field)
 *  - Info:    GET  /v2/task/info?id=<Id>   (last started/finished, ...)
 *  - Create:  POST /v2/task  (body = full task definition, no query params)
 *  - Edit:    PUT  /v2/task  (body = { id, ...definition } — `id` is a BODY field)
 *  - Delete:  DELETE /v2/task?id=<Id>      (double-confirmed)
 * All five are wired through the verified domain methods: tasks.getTask,
 * tasks.getTaskInfo, tasks.createTask, tasks.updateTask, tasks.removeTask.
 */
interface TaskForm {
  Name: string;
  RunAsUser: string;
  TaskClass: string;
  NameSpace: string;
  TimePeriod: string;
  DailyFrequency: string;
  StartDate: string;
  EndDate: string;
  Description: string;
}

const EMPTY_FORM: TaskForm = {
  Name: '',
  RunAsUser: '',
  TaskClass: '',
  NameSpace: '',
  TimePeriod: '',
  DailyFrequency: '',
  StartDate: '',
  EndDate: '',
  Description: '',
};

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('tasks.title') }}</h2>
          <p class="muted">{{ t('tasks.subtitle') }}</p>
        </div>
        <div class="toolbar">
          <button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button>
          @if (canTask) {
            <button class="ghost" (click)="openCreate()">{{ t('tasks.form.create') }}</button>
          }
        </div>
      </div>
      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (success) { <div class="card"><p class="badge ok">{{ success }}</p></div> }

      <div class="card">
        <h2>{{ t('tasks.main') }}</h2>
        <table>
          <thead><tr><th>{{ t('tasks.main.col.name') }}</th><th>{{ t('tasks.main.col.type') }}</th><th>{{ t('tasks.main.col.suspended') }}</th><th>{{ t('tasks.main.col.lastfinished') }}</th><th>{{ t('tasks.main.col.next') }}</th><th></th></tr></thead>
          <tbody>
            @for (task of tasks; track coalesce(task.Name, task.name)) {
              <tr>
                <td class="mono">{{ coalesce(task.Name, task.name) }}</td>
                <td>{{ coalesce(task.Type, task.type) }}</td>
                <td><span class="badge" [class.warn]="coalesce(task.Suspended, task.suspended)">{{ (coalesce(task.Suspended, task.suspended)) ? t('tasks.badge.suspended') : t('tasks.badge.active') }}</span></td>
                <td>{{ coalesce(task.LastFinished, task.lastFinished) }}</td>
                <td>{{ coalesce(task.NextScheduled, task.nextScheduled) }}</td>
                <td>
                  @if (task.Id) {
                    <button class="ghost" style="padding:2px 8px" (click)="selectTask(task)">{{ t('tasks.action.details') }}</button>
                  }
                  @if (canMutate) {
                    <button class="ghost" style="padding:2px 8px" (click)="runTask(task.Id)">{{ t('tasks.action.run') }}</button>
                    <button class="ghost" style="padding:2px 8px" (click)="suspendTask(task.Id)">{{ t('tasks.action.suspend') }}</button>
                    <button class="ghost" style="padding:2px 8px" (click)="resumeTask(task.Id)">{{ t('tasks.action.resume') }}</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!tasks.length) { <p class="empty">{{ t('tasks.main.empty') }}</p> }
      </div>

      <div class="card">
        <h2>{{ t('tasks.detail') }}</h2>
        @if (!selectedId) { <p class="empty">{{ t('tasks.detail.empty') }}</p> }
        @if (selectedId) {
          <p class="muted">{{ selectedName }} — {{ t('tasks.detail.id') }}: {{ selectedId }}</p>
          @if (detailLoading) { <p class="muted">{{ t('common.loading') }}</p> }
          <div class="grid cols-2">
            <div>
              <h3>{{ t('tasks.info') }}</h3>
              <div class="stat"><span class="label">{{ t('tasks.info.laststarted') }}</span><span class="value mono">{{ coalesce(info.LastStarted, '') }}</span></div>
              <div class="stat"><span class="label">{{ t('tasks.info.lastfinished') }}</span><span class="value mono">{{ coalesce(info.LastFinished, '') }}</span></div>
              <div class="stat"><span class="label">{{ t('tasks.info.next') }}</span><span class="value mono">{{ coalesce(info.NextScheduled, '') }}</span></div>
              <div class="stat"><span class="label">{{ t('tasks.info.status') }}</span><span class="value mono">{{ coalesce(info.Status, '') }}</span></div>
              <div class="stat"><span class="label">{{ t('tasks.info.error') }}</span><span class="value mono">{{ coalesce(info.Error, '') }}</span></div>
            </div>
            <div>
              <h3>{{ t('tasks.detail.definition') }}</h3>
              @if (!detailEntries.length) { <p class="empty">{{ t('tasks.detail.unavailable') }}</p> }
              <table>
                <tbody>
                  @for (entry of detailEntries; track entry.key) {
                    <tr><td class="label mono">{{ entry.key }}</td><td class="mono">{{ entry.value }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          @if (canTask) {
            <div class="toolbar" style="margin:8px 0">
              <button class="ghost" (click)="openEdit()">{{ t('tasks.action.edit') }}</button>
              <button class="ghost" (click)="deleteTask()">{{ deleteArmed ? t('tasks.delete.confirm') : t('tasks.action.delete') }}</button>
            </div>
          }
        }
      </div>

      @if (formVisible) {
        <div class="card">
          <h2>{{ t('tasks.form') }}</h2>
          <p class="muted">{{ t('tasks.form.hint') }}</p>
          <div class="grid cols-2">
            <div><label class="label">{{ t('tasks.form.name') }} *</label><input [(ngModel)]="form.Name"></div>
            <div><label class="label">{{ t('tasks.form.runasuser') }}</label><input [(ngModel)]="form.RunAsUser"></div>
            <div><label class="label">{{ t('tasks.form.taskclass') }}</label><input [(ngModel)]="form.TaskClass"></div>
            <div><label class="label">{{ t('tasks.form.namespace') }}</label><input [(ngModel)]="form.NameSpace"></div>
            <div><label class="label">{{ t('tasks.form.timeperiod') }}</label><input [(ngModel)]="form.TimePeriod" placeholder="{{ t('tasks.form.timeperiod.hint') }}"></div>
            <div><label class="label">{{ t('tasks.form.dailyfrequency') }}</label><input [(ngModel)]="form.DailyFrequency" placeholder="{{ t('tasks.form.dailyfrequency.hint') }}"></div>
            <div><label class="label">{{ t('tasks.form.startdate') }}</label><input [(ngModel)]="form.StartDate" placeholder="{{ t('tasks.form.date.hint') }}"></div>
            <div><label class="label">{{ t('tasks.form.enddate') }}</label><input [(ngModel)]="form.EndDate" placeholder="{{ t('tasks.form.date.hint') }}"></div>
          </div>
          <div style="margin:8px 0"><label class="label">{{ t('tasks.form.description') }}</label><textarea [(ngModel)]="form.Description" rows="3"></textarea></div>
          <div class="toolbar">
            @if (!editingId) {
              <button [disabled]="busy" (click)="save()">{{ busy ? t('common.loading') : t('tasks.form.create') }}</button>
            }
            @if (editingId) {
              <button [disabled]="busy" (click)="save()">{{ busy ? t('common.loading') : t('tasks.form.save') }}</button>
            }
            <button class="ghost" (click)="cancelForm()">{{ t('tasks.form.cancel') }}</button>
          </div>
        </div>
      }

      <div class="grid cols-2">
        <div class="card">
          <h2>{{ t('tasks.history') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadHistory()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('tasks.history.col.name') }}</th><th>{{ t('tasks.history.col.status') }}</th><th>{{ t('tasks.history.col.started') }}</th><th>{{ t('tasks.history.col.finished') }}</th></tr></thead>
            <tbody>
              @for (h of history; track $index) {
                <tr>
                  <td class="mono">{{ coalesce(h.TaskName, h.taskName, h.Name) }}</td>
                  <td>{{ coalesce(h.Status, h.status) }}</td>
                  <td>{{ coalesce(h.LastStart, h.TimeStarted, h.startTime) }}</td>
                  <td>{{ coalesce(h.LogDatetime, h.TimeFinished, h.finishTime) }}</td>
                </tr>
              }
            </tbody>
          </table>
          @if (!history.length) { <p class="empty">{{ t('tasks.history.empty') }}</p> }
        </div>
        <div class="card">
          <h2>{{ t('tasks.upcoming') }}</h2>
          <div class="toolbar" style="margin:8px 0"><button (click)="loadUpcoming()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('tasks.upcoming.col.name') }}</th><th>{{ t('tasks.upcoming.col.time') }}</th><th>{{ t('tasks.upcoming.col.status') }}</th></tr></thead>
            <tbody>
              @for (u of upcoming; track $index) {
                <tr><td class="mono">{{ coalesce(u.Name, u.Task, u.task) }}</td><td>{{ coalesce(u.Datetime, u.Time, u.time) }}</td><td>{{ coalesce(u.Suspended, u.Status, u.status) }}</td></tr>
              }
            </tbody>
          </table>
          @if (!upcoming.length) { <p class="empty">{{ t('tasks.upcoming.empty') }}</p> }
        </div>
      </div>

      <div class="card">
        <h2>{{ t('tasks.manager') }}</h2>
        <div class="toolbar" style="margin:8px 0">
          <button (click)="loadManager()">{{ t('common.refresh') }}</button>
          @if (canTask) {
            <button (click)="runManager()">{{ t('tasks.action.run') }}</button>
            <button (click)="suspendManager()">{{ t('tasks.action.suspend') }}</button>
            <button (click)="resumeManager()">{{ t('tasks.action.resume') }}</button>
          }
        </div>
        @if (managerError) { <p class="error">{{ managerError }}</p> }
        @if (manager) {
          <table>
            <tbody>
              @for (row of managerRows(); track $index) {
                <tr><th>{{ row[0] }}</th><td class="mono">{{ row[1] }}</td></tr>
              }
            </tbody>
          </table>
        } @else if (!managerError) { <p class="empty">{{ t('common.loading') }}</p> }
      </div>
    </div>
  `,
})
export class TasksComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  // Live permission getters (re-evaluated each CD cycle — not computed once in ngOnInit):
  get canTask(): boolean {
    return this.perms.can(PRIV.TASK);
  }
  get canOperate(): boolean {
    return this.perms.can(PRIV.OPERATE);
  }
  /** Any privilege that allows mutating task definitions. */
  get canMutate(): boolean {
    return this.canTask || this.canOperate;
  }

  tasks: any[] = [];
  history: any[] = [];
  upcoming: any[] = [];
  manager: any = null;
  managerError = '';
  loading = false;
  busy = false;
  error = '';
  success = '';

  // Detail + info for the selected task (keyed by the numeric `Id` list field).
  selectedId: string | null = null;
  selectedName = '';
  detail: any | null = null;
  detailEntries: { key: string; value: string }[] = [];
  info: any | null = null;
  detailLoading = false;

  // Create / edit form.
  formVisible = false;
  editingId: string | null = null;
  deleteArmed = false;
  form: TaskForm = { ...EMPTY_FORM };

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const l = await this.admin.client.domains.tasks.list();
      this.tasks = Array.isArray(l) ? l : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    await Promise.all([this.loadHistory(), this.loadUpcoming(), this.loadManager()]);
    this.loading = false;
  }

  async loadHistory(): Promise<void> {
    try {
      const l = await this.admin.client.domains.tasks.history();
      this.history = Array.isArray(l) ? l : [];
    } catch { this.history = []; }
  }

  async loadUpcoming(): Promise<void> {
    try {
      const l = await this.admin.client.domains.tasks.upcoming();
      this.upcoming = Array.isArray(l) ? l : (l as any)?.tasks ?? [];
    } catch { this.upcoming = []; }
  }

  async loadManager(): Promise<void> {
    try {
      this.manager = await this.admin.client.domains.tasks.managerStatus();
    } catch (e) {
      this.manager = null;
      this.managerError = this.t('tasks.manager.unavailable') + ' ' + this.admin.errorMessage(e);
    }
  }

  /** Normalize the manager status object into [key, value][] rows (template-safe). */
  managerRows(): [string, unknown][] {
    const o = this.manager && typeof this.manager === 'object' && !Array.isArray(this.manager)
      ? (this.manager as Record<string, unknown>) : {};
    return Object.entries(o);
  }

  async runTask(id: number): Promise<void> {
    try { await this.admin.client.domains.tasks.run(id, { RunNow: true }); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async suspendTask(id: number): Promise<void> {
    try { await this.admin.client.domains.tasks.suspend(id); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async resumeTask(id: number): Promise<void> {
    try { await this.admin.client.domains.tasks.resume(id); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async runManager(): Promise<void> {
    try { await this.admin.client.domains.tasks.runManager(); await this.loadManager(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async suspendManager(): Promise<void> {
    try { await this.admin.client.domains.tasks.suspendManager(); await this.loadManager(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async resumeManager(): Promise<void> {
    try { await this.admin.client.domains.tasks.resumeManager(); await this.loadManager(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // ---- Detail + info -----------------------------------------------------

  /** Select a task row and load its full definition (GET /v2/task?id=<Id>) + info. */
  selectTask(task: any): void {
    const id = this.taskIdOf(task);
    if (!id) return;
    this.selectedId = id;
    this.selectedName = coalesce(task.Name, task.name, '');
    this.loadDetail();
  }

  /** The numeric `Id` list field, as a string (null when absent). */
  private taskIdOf(task: any): string | null {
    const raw = task.Id;
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    return s === '' ? null : s;
  }

  async loadDetail(): Promise<void> {
    if (!this.selectedId) return;
    this.detailLoading = true;
    this.error = '';
    try {
      const d = await this.admin.client.domains.tasks.getTask(this.selectedId).catch(() => null);
      this.detail = d;
      this.detailEntries = this.entriesOf(d);
      this.syncFormFromDetail();
      this.editingId = this.selectedId;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    await this.loadInfo();
    this.detailLoading = false;
  }

  /** Non-configurable task info: last started/finished, status, ... (GET /v2/task/info?id=<Id>). */
  async loadInfo(): Promise<void> {
    if (!this.selectedId) return;
    try {
      const i = await this.admin.client.domains.tasks.getTaskInfo(this.selectedId).catch(() => null);
      this.info = i;
    } catch { this.info = null; }
  }

  /** Flatten an object to {key, value} rows, normalizing numbers/booleans/arrays in TS. */
  private entriesOf(obj: unknown): { key: string; value: string }[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => ({ key: k, value: this.str(v) }));
  }

  private str(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  private selectTaskByName(name: string): void {
    const found = this.tasks.find((x) => coalesce(x.Name, x.name) === name);
    if (found) this.selectTask(found);
  }

  // ---- Create / edit / delete --------------------------------------------

  openCreate(): void {
    if (!this.canTask) return;
    this.form = { ...EMPTY_FORM };
    this.editingId = null;
    this.deleteArmed = false;
    this.formVisible = true;
  }

  openEdit(): void {
    if (!this.canTask || !this.selectedId) return;
    this.editingId = this.selectedId;
    this.syncFormFromDetail();
    this.deleteArmed = false;
    this.formVisible = true;
  }

  /** Prefill the form from the loaded detail (only the key fields). */
  private syncFormFromDetail(): void {
    const d = this.detail;
    if (!d) return;
    this.form = {
      Name: this.str(d.Name),
      RunAsUser: this.str(d.RunAsUser),
      TaskClass: this.str(d.TaskClass),
      NameSpace: this.str(d.NameSpace),
      TimePeriod: this.str(d.TimePeriod),
      DailyFrequency: this.str(d.DailyFrequency),
      StartDate: this.str(d.StartDate),
      EndDate: this.str(d.EndDate),
      Description: this.str(d.Description),
    };
  }

  cancelForm(): void {
    this.formVisible = false;
    this.deleteArmed = false;
  }

  /** Only non-blank fields go in the body (blank = keep current value when editing). */
  private buildBody(): Partial<Task> {
    const f = this.form;
    const out: Partial<Task> = {};
    if (f.Name.trim()) out.Name = f.Name.trim();
    if (f.RunAsUser.trim()) out.RunAsUser = f.RunAsUser.trim();
    if (f.TaskClass.trim()) out.TaskClass = f.TaskClass.trim();
    if (f.NameSpace.trim()) out.NameSpace = f.NameSpace.trim();
    if (f.TimePeriod.trim()) out.TimePeriod = f.TimePeriod.trim() as Task['TimePeriod'];
    if (f.DailyFrequency.trim()) out.DailyFrequency = f.DailyFrequency.trim() as Task['DailyFrequency'];
    if (f.StartDate.trim()) out.StartDate = f.StartDate.trim();
    if (f.EndDate.trim()) out.EndDate = f.EndDate.trim();
    if (f.Description.trim()) out.Description = f.Description.trim();
    return out;
  }

  /** Create (POST /v2/task) or edit (PUT /v2/task, body = { id, ...definition }). */
  async save(): Promise<void> {
    if (!this.canTask || this.busy) return;
    if (!this.form.Name.trim()) {
      this.error = this.t('tasks.form.nameRequired');
      return;
    }
    const body = this.buildBody();
    this.busy = true;
    this.error = '';
    try {
      if (this.editingId) {
        await this.admin.client.domains.tasks.updateTask(this.editingId, body);
        this.success = this.t('tasks.updated');
      } else {
        await this.admin.client.domains.tasks.createTask(body);
        this.success = this.t('tasks.created');
      }
      this.formVisible = false;
      this.deleteArmed = false;
      await this.load();
      this.selectTaskByName(body.Name as string);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  /** DELETE /v2/task?id=<Id> — DANGEROUS: double-confirmed (first click arms, second fires). */
  async deleteTask(): Promise<void> {
    if (!this.canTask || !this.editingId) return;
    if (!this.deleteArmed) {
      this.deleteArmed = true;
      return;
    }
    const id = this.editingId;
    this.deleteArmed = false;
    this.busy = true;
    this.error = '';
    try {
      await this.admin.client.domains.tasks.removeTask(id);
      this.success = this.t('tasks.deleted');
      this.selectedId = null;
      this.selectedName = '';
      this.detail = null;
      this.detailEntries = [];
      this.info = null;
      this.editingId = null;
      this.formVisible = false;
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }
}
