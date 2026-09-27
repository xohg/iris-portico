import { Component, inject, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-controls">
        <button class="ghost" [title]="i18n.toggleTitle" (click)="i18n.setLang(i18n.lang === 'en' ? 'zh' : 'en')">{{ i18n.toggleLabel }}</button>
        <button class="ghost" [title]="theme.label" (click)="theme.toggle()">{{ theme.icon }}</button>
      </div>
      <form class="card login-card" (ngSubmit)="submit()">
        <div class="login-logo">
          <img class="logo-light" src="iris-portico-logo.svg" alt="IRIS Portico" />
          <img class="logo-dark" src="iris-portico-logo-dark.svg" alt="IRIS Portico" />
        </div>
        <h1>{{ t('login.title') }}</h1>
        <p class="muted">{{ t('login.subtitle') }}</p>
        @if (busy) { <p class="muted">{{ t('login.submitting') }}</p> }
        @if (error) { <p class="error">{{ error }}</p> }
        <div class="field">
          <label>{{ t('login.username') }}</label>
          <input name="user" #userRef [(ngModel)]="user" (change)="user = userRef.value" placeholder="Superuser" autocomplete="username" />
        </div>
        <div class="field">
          <label>{{ t('login.password') }}</label>
          <input name="password" #passRef type="password" [(ngModel)]="password" (change)="password = passRef.value" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <div class="field">
          <label>{{ t('login.role') }}</label>
          <input name="role" #roleRef [(ngModel)]="role" (change)="role = roleRef.value" [placeholder]="t('login.rolePlaceholder')" />
        </div>
        <button type="submit" [disabled]="busy">{{ busy ? t('login.submitting') : t('login.submit') }}</button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  t = (k: string) => this.i18n.t(k);

  @ViewChild('userRef') private userRef!: ElementRef<HTMLInputElement>;
  @ViewChild('passRef') private passRef!: ElementRef<HTMLInputElement>;
  @ViewChild('roleRef') private roleRef!: ElementRef<HTMLInputElement>;

  user = 'Portico';
  password = '';
  role = '';
  busy = false;
  error = '';

  async submit(): Promise<void> {
    // Browser password managers can fill the fields WITHOUT firing the
    // input event that ngModel listens to (e.g. a saved credential
    // restored before Angular binds, or picked from the autofill
    // dropdown). The model would then stay '' while the field shows a
    // value — the request goes out with an empty password and the
    // server answers 401. Read the DOM values as the source of truth.
    const user = this.userRef?.nativeElement.value ?? this.user;
    const password = this.passRef?.nativeElement.value ?? this.password;
    const role = this.roleRef?.nativeElement.value ?? this.role;
    this.user = user;
    this.password = password;
    this.role = role;

    this.busy = true;
    this.error = '';
    if (!password) {
      this.error = this.t('login.emptyPassword');
      this.busy = false;
      return;
    }
    try {
      await this.auth.login(user, password, role || undefined);
      await this.router.navigate(['/']);
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.busy = false;
    }
  }
}
