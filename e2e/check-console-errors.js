// Identify the residual 404/400 console errors: log in, walk all pages,
// capture every 4xx/5xx API response with its URL + status.
'use strict';
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();

  const bad = [];
  page.on('response', (res) => {
    const s = res.status();
    const url = res.url();
    if (s >= 400 && url.includes('/api/admin')) {
      bad.push({ status: s, url: url.replace('http://localhost:80', '') });
    }
  });

  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.fill('input[name="user"]', 'Portico');
  await page.fill('input[name="password"]', 'Portico123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const pages = ['/', '/webapps', '/permissions', '/security', '/tasks', '/system',
    '/databases', '/logs', '/async', '/ecp', '/ext-lang-servers',
    '/namespaces', '/license', '/wqm'];
  for (const p of pages) {
    await page.goto('http://localhost:80' + p, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
  }

  // dedupe
  const seen = new Set();
  const uniq = bad.filter((b) => {
    const k = b.status + ' ' + b.url;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log('=== 4xx/5xx API responses observed (deduped) ===');
  for (const b of uniq) console.log(`${b.status}  ${b.url}`);
  console.log(`\ntotal unique: ${uniq.length}`);

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
