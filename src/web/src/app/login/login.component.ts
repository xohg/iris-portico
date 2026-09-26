import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <form class="card login-card" (ngSubmit)="submit()">
        <h1>◈ {{ t('login.title') }}</h1>
        <p class="muted">{{ t('login.subtitle') }}</p>
        @if (busy) { <p class="muted">{{ t('login.submitting') }}</p> }
        @if (error) { <p class="error">{{ error }}</p> }
        <div class="field">
          <label>{{ t('login.username') }}</label>
          <input name="user" [(ngModel)]="user" placeholder="Superuser" autocomplete="username" />
        </div>
        <div class="field">
          <label>{{ t('login.password') }}</label>
          <input name="password" type="password" [(ngModel)]="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <div class="field">
          <label>{{ t('login.role') }}</label>
          <input name="role" [(ngModel)]="role" [placeholder]="t('login.rolePlaceholder')" />
        </div>
        <button type="submit" [disabled]="busy">{{ busy ? t('login.submitting') : t('login.submit') }}</button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  t = (k: string) => this.i18n.t(k);

  user = 'Portico';
  password = '';
  role = '';
  busy = false;
  error = '';

  async submit(): Promise<void> {
    this.busy = true;
    this.error = '';
    try {
      await this.auth.login(this.user, this.password, this.role || undefined);
      await this.router.navigate(['/']);
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.busy = false;
    }
  }
}
