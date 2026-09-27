import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../core/admin.service';
import { PermissionService } from '../core/permission.service';
import { I18nService } from '../core/i18n.service';
import { coalesce } from '../core/coalesce';
import type { Info } from '@iris-portico/api-client';

interface Stat { label: string; value: string | number; path: string; }

/**
 * Dashboard — overview: server identity, system usage, resource counts and the
 * privileges the current user holds (which drive what the portal enables).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('dashboard.title') }}</h2>
          <p class="muted">
            @if (info) {
              {{ info.product }} {{ info.serverVersion }} · {{ t('dashboard.subtitle.mode') }} {{ info.systemMode }}
              @if (info.username) { · {{ info.username }} }
            }
          </p>
        </div>
        <button class="ghost" (click)="load()">{{ loading ? t('common.refreshing') : t('common.refresh') }}</button>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <div class="grid cols-4">
        @for (s of stats; track s.label) {
          <a [routerLink]="s.path" class="card stat" style="text-decoration:none;color:inherit">
            <span class="value">{{ s.value }}</span>
            <span class="label">{{ s.label }}</span>
          </a>
        }
      </div>

      <div class="grid cols-3">
        <div class="card">
          <h2>{{ t('dashboard.system') }}</h2>
          @if (usage) {
            <div class="grid cols-2" style="margin-top:8px">
              <div class="stat"><span class="value">{{ coalesce(usage?.SystemUsage?.Processes, '—') }}</span><span class="label">{{ t('dashboard.col.processes') }}</span></div>
              <div class="stat"><span class="value">{{ coalesce(usage?.SystemUsage?.CSPSessions, '—') }}</span><span class="label">{{ t('dashboard.col.csp') }}</span></div>
              <div class="stat"><span class="value">{{ coalesce(usage?.SystemUsage?.JournalEntries, '—') }}</span><span class="label">{{ t('dashboard.col.journal') }}</span></div>
              <div class="stat"><span class="value">{{ coalesce(usage?.SystemUsage?.WriteDaemon, '—') }}</span><span class="label">{{ t('dashboard.col.writedaemon') }}</span></div>
            </div>
          } @else {
            <p class="muted">{{ t('common.loading') }}</p>
          }
        </div>
        <div class="card">
          <h2>{{ t('dashboard.performance') }}</h2>
          @if (usage?.Performance) {
            <div class="grid cols-2" style="margin-top:8px">
              <div class="stat"><span class="value">{{ coalesce(usage.Performance.GlobalRefsPerSecond, '—') }}</span><span class="label">{{ t('dashboard.perf.globalRefsPerSec') }}</span></div>
              <div class="stat"><span class="value">{{ perfNum(usage.Performance.LogicalRequests) }}</span><span class="label">{{ t('dashboard.perf.logicalRequests') }}</span></div>
            </div>
            <div class="bar-row" style="margin-top:12px">
              <span class="muted small" style="width:100px">{{ t('dashboard.perf.cacheEff') }}</span>
              <span class="bar"><i [class.ok]="perfNum(usage.Performance.CacheEfficiency) >= 80" [class.warn]="perfNum(usage.Performance.CacheEfficiency) < 80 && perfNum(usage.Performance.CacheEfficiency) >= 50" [style.width]="perfNum(usage.Performance.CacheEfficiency) + '%'"></i></span>
              <span class="bar-val">{{ coalesce(usage.Performance.CacheEfficiency, '—') }}%</span>
            </div>
            <div class="bar-row" style="margin-top:8px">
              <span class="muted small" style="width:100px">{{ t('dashboard.perf.diskReads') }}</span>
              <span class="bar"><i [style.width]="diskPct('DiskReads') + '%'"></i></span>
              <span class="bar-val">{{ perfNum(usage.Performance.DiskReads) }}</span>
            </div>
            <div class="bar-row" style="margin-top:8px">
              <span class="muted small" style="width:100px">{{ t('dashboard.perf.diskWrites') }}</span>
              <span class="bar"><i [style.width]="diskPct('DiskWrites') + '%'"></i></span>
              <span class="bar-val">{{ perfNum(usage.Performance.DiskWrites) }}</span>
            </div>
          } @else {
            <p class="muted">{{ t('common.loading') }}</p>
          }
        </div>
        <div class="card">
          <h2>{{ t('dashboard.privileges') }}</h2>
          <p class="muted">{{ t('dashboard.privileges.desc') }}</p>
          <div class="row" style="margin-top:8px">
            @for (p of privileges; track p) { <span class="badge">{{ p }}</span> }
            @if (!privileges.length) { <span class="muted">{{ t('dashboard.privileges.none') }}</span> }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);
  private readonly i18n = inject(I18nService);

  t = (k: string) => this.i18n.t(k);
  coalesce = coalesce;

  info: Info | null = null;
  usage: any = null;
  stats: Stat[] = [];
  privileges: string[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    const c = this.admin.client;
    try {
      this.info = await c.getInfo();
      this.privileges = this.perms.heldPrivileges;
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    // Resource counts (each is best-effort; a missing privilege degrades gracefully).
    const counts: Array<[string, string, Promise<number>]> = [
      [this.i18n.t('stat.webapps'), '/webapps', c.get('/v2/web-apps').then((r: any) => (Array.isArray(r) ? r.length : 0)).catch(() => 0)],
      [this.i18n.t('stat.users'), '/permissions', c.get('/v2/security/users').then((r: any) => (Array.isArray(r) ? r.length : 0)).catch(() => 0)],
      [this.i18n.t('stat.roles'), '/permissions', c.get('/v2/security/roles').then((r: any) => (Array.isArray(r) ? r.length : 0)).catch(() => 0)],
      [this.i18n.t('stat.tasks'), '/tasks', c.get('/v2/tasks').then((r: any) => (Array.isArray(r) ? r.length : 0)).catch(() => 0)],
    ];
    const results = await Promise.all(counts.map((x) => x[2]));
    this.stats = counts.map((x, i) => ({ label: x[0], value: results[i], path: x[1] }));
    try {
      this.usage = await c.get('/v2/monitor/dashboard/main');
    } catch {
      this.usage = null;
    }
    this.loading = false;
  }

  /** Coerce a performance value to a finite number (template-safe). */
  perfNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /** Disk read/write bar width, relative to the larger of the two (template-safe). */
  diskPct(key: 'DiskReads' | 'DiskWrites'): number {
    const p = this.usage?.Performance;
    const r = this.perfNum(p?.DiskReads);
    const w = this.perfNum(p?.DiskWrites);
    const max = Math.max(r, w);
    const v = key === 'DiskReads' ? r : w;
    return max > 0 ? Math.min(100, (v / max) * 100) : 0;
  }
}
