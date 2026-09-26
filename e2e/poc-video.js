// PoC: prove Playwright can record a headless video of the portal.
'use strict';
const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'vid-test', size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  // login
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
  }
  await page.waitForTimeout(2000);
  // walk two pages
  for (const p of ['/webapps', '/tasks']) {
    await page.goto('http://localhost:80' + p, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
  }
  await page.close();
  await ctx.close();
  await browser.close();
  console.log('video recorded -> vid-test/');
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(2); });
