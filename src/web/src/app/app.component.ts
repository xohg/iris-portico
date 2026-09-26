import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component: a bare router outlet.
 *
 * The authenticated shell (sidebar + top bar) lives in ShellComponent and is
 * mounted as the `component` of the guard-protected `''` route, so unauthenticated
 * visitors see only the sign-in page — no navigation chrome.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
  `,
})
export class AppComponent {}
