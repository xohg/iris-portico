// Identify the residual 404 during the dashboard + new-pages flow.
'use strict';
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();
  const bad = [];
  page.on('response', (res) => {
    if (res.status() >= 400) bad.push({ status: res.status(), url: res.url() });
  });
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.fill('input[name="user"]', 'Portico');
  await page.fill('input[name="password"]', 'Portico123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  for (const p of ['/', '/namespaces', '/license', '/wqm', '/']) {
    await page.goto('http://localhost:80' + p, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
  }
  const seen = new Set();
  for (const b of bad) {
    const k = b.status + ' ' + b.url;
    if (seen.has(k)) continue; seen.add(k);
    console.log(`${b.status}  ${b.url}`);
  }
  await browser.close(); process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
