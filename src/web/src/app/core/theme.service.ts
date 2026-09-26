import { Injectable } from '@angular/core';

export type ThemeName = 'dark' | 'light';

/**
 * Theme switching.
 *
 * All colors in styles.css are CSS custom properties on `:root`; the light
 * theme is a full token override under `:root[data-theme='light']`. This
 * service flips the `data-theme` attribute on `<html>`, persists the choice
 * in localStorage, and defaults to the OS preference (prefers-color-scheme).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme: ThemeName = 'dark';

  constructor() {
    const stored = this.readStored();
    this.theme = stored ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    this.apply();
  }

  /** Icon for the toggle button: shows the theme you would switch TO. */
  get icon(): string {
    return this.theme === 'dark' ? '☀️' : '🌙';
  }

  get label(): string {
    return this.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  toggle(): void {
    this.set(this.theme === 'dark' ? 'light' : 'dark');
  }

  set(theme: ThemeName): void {
    this.theme = theme;
    localStorage.setItem('portico-theme', theme);
    this.apply();
  }

  private apply(): void {
    document.documentElement.dataset.theme = this.theme;
  }

  private readStored(): ThemeName | null {
    const v = localStorage.getItem('portico-theme');
    return v === 'dark' || v === 'light' ? v : null;
  }
}
