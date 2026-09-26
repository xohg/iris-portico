/**
 * IRIS Portico — headless UI smoke test.
 *
 * Logs in and walks every route, collecting:
 *  - page console errors
 *  - failed network requests (non-2xx)
 *  - a screenshot per page
 *
 * Run:  node smoke.js
 */
'use strict';
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:80';
const USER = 'Portico';
const PASS = 'Portico123';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.join(__dirname, 'out');

const ROUTES = [
  { path: '/', name: 'dashboard' },
  { path: '/webapps', name: 'webapps' },
  { path: '/permissions', name: 'permissions' },
  { path: '/security', name: 'security' },
  { path: '/tasks', name: 'tasks' },
  { path: '/system', name: 'system' },
  { path: '/logs', name: 'logs' },
  { path: '/async', name: 'async' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) {
      failedRequests.push(`${r.request().method()} ${r.url()} -> ${r.status()}`);
    }
  });

  // 1. Load the app (should redirect to /login).
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const onLogin = page.url().includes('/login');
  console.log('step 1: initial load -> ' + page.url() + (onLogin ? ' (login form shown)' : ''));
  if (!onLogin) {
    console.log('NOTE: not redirected to login (maybe persisted session). Continuing.');
  }

  // 2. Log in.
  if (onLogin) {
    await page.fill('input[name="user"]', USER);
    await page.fill('input[name="password"]', PASS);
    await page.click('button[type="submit"]');
    // Wait for the dashboard to appear (login success) or an error message.
    await page.waitForTimeout(3000);
    const hasError = await page.locator('.error').count();
    const errText = hasError ? await page.locator('.error').first().textContent() : '';
    console.log('step 2: login -> url=' + page.url() + (hasError ? ' | ERROR: ' + errText.trim() : ' | OK'));
  }

  // 3. Walk every route.
  const results = [];
  for (const r of ROUTES) {
    const before = { ce: consoleErrors.length, fr: failedRequests.length };
    try {
      await page.goto(BASE + r.path, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500); // let lazy data render
      const shot = path.join(OUT, r.name + '.png');
      await page.screenshot({ path: shot, fullPage: false });
      // Grab a short text sample of the main content area.
      const bodyText = await page.evaluate(() => {
        const el = document.querySelector('main, app-root');
        return el ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 300) : '(no content)';
      });
      const newErrors = consoleErrors.slice(before.ce);
      const newFailed = failedRequests.slice(before.fr);
      const status = newErrors.length || newFailed.length ? 'WARN' : 'OK';
      results.push({ name: r.name, path: r.path, status, newErrors, newFailed, bodyText });
    } catch (e) {
      results.push({ name: r.name, path: r.path, status: 'FAIL', newErrors: [e.message], newFailed: [], bodyText: '' });
    }
  }

  // 4. Report.
  console.log('\n================ RESULTS ================');
  for (const r of results) {
    console.log(`\n[${r.status}] ${r.name} (${r.path})`);
    if (r.newErrors.length) console.log('  console errors:');
    r.newErrors.slice(0, 5).forEach((e) => console.log('    ' + e.slice(0, 200)));
    if (r.newFailed.length) console.log('  failed requests:');
    r.newFailed.slice(0, 10).forEach((e) => console.log('    ' + e.slice(0, 160)));
    if (r.bodyText) console.log('  content sample: ' + r.bodyText.slice(0, 180));
  }
  const ok = results.filter((r) => r.status === 'OK').length;
  const summary =
    `SUMMARY: ${ok}/${results.length} pages clean, ${results.length - ok} with warnings/errors\n` +
    results.map((r) => `[${r.status}] ${r.name} (${r.path})${r.newErrors.length ? ' errors=' + r.newErrors.length : ''}${r.newFailed.length ? ' failedReqs=' + r.newFailed.length : ''}\n   content: ${r.bodyText.slice(0, 150)}`).join('\n') +
    `\nscreenshots in: ${OUT}\n`;
  fs.writeFileSync(path.join(OUT, 'summary.txt'), summary);
  console.log(`\nSUMMARY: ${ok}/${results.length} pages clean, ${results.length - ok} with warnings/errors`);
  console.log('screenshots in: ' + OUT);

  await browser.close();
  process.exitCode = results.length - ok > 0 ? 1 : 0;
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(2); });
