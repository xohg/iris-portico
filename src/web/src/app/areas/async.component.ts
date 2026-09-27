import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';

/**
 * Async Task Center.
 *
 * Long-running SysAdmin operations return 202 + a Location header pointing at
 * /v2/async-result?id=<GUID>. This center lists those async tasks, polls their
 * status, and lets the user cancel / pause / resume them.
 */
@Component({
  selector: 'app-async',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('async.title') }}</h2>
          <p class="muted">{{ t('async.subtitle') }}</p>
        </div>
        <div class="toolbar">
          <button (click)="load()" [disabled]="loading">{{ loading ? t('common.loading') : t('common.refresh') }}</button>
          <button class="ghost" (click)="toggleAuto()">{{ auto ? t('async.autoOn') : t('async.autoOff') }}</button>
        </div>
      </div>
      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <div class="card">
        <div class="toolbar" style="margin-bottom:12px">
          <input [placeholder]="t('async.searchPlaceholder')" [(ngModel)]="taskId" style="min-width:260px" />
          <button (click)="checkOne()">{{ t('async.checkOne') }}</button>
        </div>
        @if (tasks.length) {
          <table>
            <thead><tr><th>{{ t('async.col.guid') }}</th><th>{{ t('async.col.task') }}</th><th>{{ t('async.col.state') }}</th><th>{{ t('async.col.started') }}</th><th>{{ t('async.col.finished') }}</th><th></th></tr></thead>
            <tbody>
              @for (task of tasks; track coalesce(task.GUID, task.id)) {
                <tr>
                  <td class="mono">{{ coalesce(task.GUID, task.id) }}</td>
                  <td class="mono">{{ coalesce(task.TaskName, task.taskName) }}</td>
                  <td><span class="badge" [class.ok]="(coalesce(task.State, task.state)) === 'Finished'" [class.warn]="(coalesce(task.State, task.state)) === 'Running'">{{ coalesce(task.State, task.state) }}</span></td>
                  <td>{{ coalesce(task.TimeStarted, task.startTime) }}</td>
                  <td>{{ coalesce(task.TimeFinished, task.finishTime) }}</td>
                  <td>
                    @if (canTask) {
                      <button class="ghost" style="padding:2px 8px" (click)="cancel(coalesce(task.GUID, task.id))">{{ t('common.cancel') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="pause(coalesce(task.GUID, task.id))">{{ t('async.pause') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="resume(coalesce(task.GUID, task.id))">{{ t('async.resume') }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty">{{ t('async.empty') }}</p>
        }
      </div>
    </div>
  `,
})
export class AsyncComponent implements OnInit, OnDestroy {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);
  private timer: ReturnType<typeof setInterval> | null = null;

  tasks: any[] = [];
  taskId = '';
  loading = false;
  error = '';
  auto = false;
  canTask = false;

  ngOnInit(): void {
    this.canTask = this.perms.can(PRIV.TASK);
    this.load();
  }

  ngOnDestroy(): void {
    this.toggleAuto(false);
  }

  toggleAuto(force?: boolean): void {
    const on = force ?? !this.auto;
    this.auto = on;
    if (on && !this.timer) {
      this.timer = setInterval(() => this.load(), 5000);
    } else if (!on && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const l = await this.admin.client.domains.tasks.listAsync();
      this.tasks = Array.isArray(l) ? l : (l as any)?.results ?? [];
    } catch {
      this.tasks = [];
    }
    this.loading = false;
  }

  async checkOne(): Promise<void> {
    if (!this.taskId) return;
    try {
      const r = await this.admin.client.domains.tasks.getAsync(this.taskId);
      this.tasks = [r, ...this.tasks.filter((t: any) => (t.GUID ?? t.id) !== (r as any).GUID)];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async cancel(id: string): Promise<void> {
    try { await this.admin.client.domains.tasks.cancelAsync(id); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async pause(id: string): Promise<void> {
    try { await this.admin.client.domains.tasks.pauseAsync(id); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async resume(id: string): Promise<void> {
    try { await this.admin.client.domains.tasks.resumeAsync(id); await this.load(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
}
