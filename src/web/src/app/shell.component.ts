import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth.service';
import { PermissionService } from './core/permission.service';
import { ThemeService } from './core/theme.service';
import { I18nService } from './core/i18n.service';
import type { Info } from '@iris-portico/api-client';
import { coalesce } from './core/coalesce';

interface NavItem {
  key: string; // i18n key for the label
  path: string;
  icon: string;
}

/**
 * The authenticated application shell: sidebar + top bar + router outlet.
 *
 * Mounted as the `component` of the guard-protected `''` route, so the shell
 * (and its navigation) is only rendered once the user is signed in. The
 * `/login` route renders on its own, without the shell.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell" [class.shell--collapsed]="collapsed && layout === 'side'" [class.shell--top]="layout === 'top'">
      @if (layout === 'side') {
        <aside class="sidebar">
          <div class="brand">
            <img class="brand-mark" src="iris-portico-icon.svg" alt="" />
            @if (!collapsed) {
              <div>
                <h1>{{ t('shell.brand') }}</h1>
                <p>{{ t('shell.brandSub') }}</p>
              </div>
            }
          </div>
          <nav>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="icon">{{ nav[0].icon }}</span>
              @if (!collapsed) { {{ t(nav[0].key) }} }
            </a>
            @for (item of nav.slice(1); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active">
                <span class="icon">{{ item.icon }}</span>
                @if (!collapsed) { {{ t(item.key) }} }
              </a>
            }
          </nav>
        </aside>
      }

      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <button class="ghost" [title]="t('shell.toggleCollapse')" (click)="toggleCollapse()">{{ collapsed ? '»' : '«' }}</button>
            <button class="ghost" [title]="t('shell.toggleLayout')" (click)="toggleLayout()">{{ layout === 'top' ? '⬅' : '⬆' }}</button>
            <div class="crumb">{{ t('shell.brand') }}</div>
          </div>
          <div class="userbox">
            <button class="ghost" [title]="i18n.toggleTitle" (click)="i18n.setLang(i18n.lang === 'en' ? 'zh' : 'en')">{{ i18n.toggleLabel }}</button>
            <button class="ghost" [title]="theme.label" (click)="theme.toggle()">{{ theme.icon }}</button>
            @if (info) {
              <span class="privs" [title]="t('shell.privilegesTitle')">
                {{ heldPrivileges.length }} {{ t('shell.privileges') }}
              </span>
              <span class="user">{{ coalesce(info.username, 'user') }}</span>
              <button class="ghost" (click)="logout()">{{ t('shell.logout') }}</button>
            }
          </div>
        </header>
        @if (layout === 'top') {
          <nav class="topnav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="icon">{{ nav[0].icon }}</span> {{ t(nav[0].key) }}
            </a>
            @for (item of nav.slice(1); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active">
                <span class="icon">{{ item.icon }}</span> {{ t(item.key) }}
              </a>
            }
          </nav>
        }
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  coalesce = coalesce;
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly perms = inject(PermissionService);
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);
  t = (k: string) => this.i18n.t(k);

  info: Info | null = null;
  heldPrivileges: string[] = [];

  // Unified icon style: every nav item uses a colored emoji (consistent
  // weight and color across the menu). The earlier mix of monochrome glyphs
  // (▦ / ⚙ / ⟳) and monochrome emoji (🕸 / ⏱ / 🗄) rendered as a mix of
  // colored and black-and-white icons, so those were replaced with colored
  // equivalents (📡 / 📋 / 🛢).
  nav: NavItem[] = [
    { key: 'nav.dashboard', path: '/', icon: '📊' },
    { key: 'nav.webapps', path: '/webapps', icon: '📡' },
    { key: 'nav.permissions', path: '/permissions', icon: '🛡' },
    { key: 'nav.security', path: '/security', icon: '🔐' },
    { key: 'nav.tasks', path: '/tasks', icon: '📋' },
    { key: 'nav.system', path: '/system', icon: '🖥' },
    { key: 'nav.databases', path: '/databases', icon: '🛢' },
    { key: 'nav.namespaces', path: '/namespaces', icon: '🧩' },
    { key: 'nav.ecp', path: '/ecp', icon: '🔗' },
    { key: 'nav.extlang', path: '/ext-lang-servers', icon: '🌐' },
    { key: 'nav.logs', path: '/logs', icon: '📜' },
    { key: 'nav.async', path: '/async', icon: '⏳' },
    { key: 'nav.wqm', path: '/wqm', icon: '🧵' },
    { key: 'nav.license', path: '/license', icon: '🎫' },
  ];

  // Layout state (persisted to localStorage).
  collapsed = false;
  layout: 'side' | 'top' = 'side';

  ngOnInit(): void {
    this.auth.info$.subscribe((info) => (this.info = info));
    this.heldPrivileges = this.perms.heldPrivileges;
    this.restoreLayout();
  }

  logout(): void {
    this.auth.logout().then(() => this.router.navigate(['/login']));
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.persistLayout();
  }

  toggleLayout(): void {
    this.layout = this.layout === 'side' ? 'top' : 'side';
    this.persistLayout();
  }

  private persistLayout(): void {
    try {
      localStorage.setItem('portico.layout', JSON.stringify({ collapsed: this.collapsed, layout: this.layout }));
    } catch {
      /* storage unavailable — ignore */
    }
  }

  private restoreLayout(): void {
    try {
      const raw = localStorage.getItem('portico.layout');
      if (!raw) return;
      const s = JSON.parse(raw) as { collapsed?: boolean; layout?: 'side' | 'top' };
      this.collapsed = s.collapsed === true;
      this.layout = s.layout === 'top' ? 'top' : 'side';
    } catch {
      /* corrupt/absent — keep defaults */
    }
  }
}
