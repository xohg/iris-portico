import { Injectable } from '@angular/core';
import { enDict } from './i18n/en';
import { zhDict } from './i18n/zh';

export type Lang = 'en' | 'zh';

/**
 * Runtime i18n (Chinese + English).
 *
 * Deliberately NOT @angular/localize: that requires a separate build pipeline
 * per locale (i18n budgets, per-locale bundles), which would re-introduce the
 * AOT/esbuild risk the `coalesce()` fix exists to avoid. This service keeps a
 * single build and swaps dictionaries at runtime:
 *
 *  - components call `t('key')` (a plain method, AOT-safe like coalesce)
 *  - the choice persists in localStorage; default = navigator.language
 *  - `setLang()` flips the active dictionary; default (non-OnPush) change
 *    detection re-evaluates every `t()` binding on the next CD cycle
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  lang: Lang = 'en';
  private readonly dicts: Record<Lang, Record<string, string>> = { en: enDict, zh: zhDict };

  constructor() {
    const stored = this.readStored();
    this.lang = stored ?? (navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en');
    this.apply();
  }

  /** Translate a key; falls back to English, then to the key itself. */
  t(key: string): string {
    const v = this.dicts[this.lang][key];
    if (v !== undefined) return v;
    const en = enDict[key];
    return en !== undefined ? en : key;
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    localStorage.setItem('portico-lang', lang);
    this.apply();
  }

  /** Label for the toggle button: shows the language you would switch TO. */
  get toggleLabel(): string {
    return this.lang === 'en' ? '中文' : 'EN';
  }

  get toggleTitle(): string {
    return this.lang === 'en' ? 'Switch to Chinese' : 'Switch to English';
  }

  private apply(): void {
    document.documentElement.lang = this.lang;
  }

  private readStored(): Lang | null {
    const v = localStorage.getItem('portico-lang');
    return v === 'en' || v === 'zh' ? v : null;
  }
}
