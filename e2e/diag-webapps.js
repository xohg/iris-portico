// Focused: load /webapps, capture console (DIAG lines), and read the rendered badge.
'use strict';
const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('DIAG')) logs.push(t);
  });
  await page.goto('http://localhost:80/webapps', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.goto('http://localhost:80/webapps', { waitUntil: 'networkidle', timeout: 30000 });
  }
  await page.waitForTimeout(2500);
  console.log('=== console DIAG lines ===');
  logs.forEach((l) => console.log(l));
  // Also read the rendered first row badge
  const first = await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (!tr) return null;
    const badge = tr.querySelector('.badge');
    return { text: badge ? badge.innerText : '?', cls: badge ? badge.className : '?' };
  });
  console.log('=== rendered first-row badge ===');
  console.log(JSON.stringify(first));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
