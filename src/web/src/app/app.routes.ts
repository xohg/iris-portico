import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    // The authenticated shell (sidebar + top bar) is mounted here, so the
    // navigation chrome is only rendered for signed-in users.
    loadComponent: () => import('./shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./areas/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'webapps', loadComponent: () => import('./areas/webapps.component').then((m) => m.WebAppsComponent) },
      { path: 'permissions', loadComponent: () => import('./areas/permissions.component').then((m) => m.PermissionsComponent) },
      { path: 'security', loadComponent: () => import('./areas/security.component').then((m) => m.SecurityComponent) },
      { path: 'tasks', loadComponent: () => import('./areas/tasks.component').then((m) => m.TasksComponent) },
      { path: 'system', loadComponent: () => import('./areas/system.component').then((m) => m.SystemComponent) },
      { path: 'databases', loadComponent: () => import('./areas/databases.component').then((m) => m.DatabasesComponent) },
      { path: 'ecp', loadComponent: () => import('./areas/ecp.component').then((m) => m.EcpComponent) },
      { path: 'ext-lang-servers', loadComponent: () => import('./areas/lang-servers.component').then((m) => m.LangServersComponent) },
      { path: 'logs', loadComponent: () => import('./areas/logs.component').then((m) => m.LogsComponent) },
      { path: 'async', loadComponent: () => import('./areas/async.component').then((m) => m.AsyncComponent) },
      { path: 'namespaces', loadComponent: () => import('./areas/namespaces.component').then((m) => m.NamespacesComponent) },
      { path: 'license', loadComponent: () => import('./areas/license.component').then((m) => m.LicenseComponent) },
      { path: 'wqm', loadComponent: () => import('./areas/wqm.component').then((m) => m.WqmComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
