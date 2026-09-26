// Click through the security page tabs and report row counts per tab.
'use strict';
const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://localhost:80/security', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.goto('http://localhost:80/security', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
  }
  const tabs = await page.locator('.tabbar button').all();
  console.log('found ' + tabs.length + ' tab buttons');
  for (let i = 0; i < tabs.length; i++) {
    const label = (await tabs[i].textContent() || '').trim();
    if (!label) continue;
    await tabs[i].click();
    await page.waitForTimeout(1800);
    const rows = await page.evaluate(() => [...document.querySelectorAll('table')].reduce((s, t) => s + t.querySelectorAll('tbody tr').length, 0));
    const first = await page.evaluate(() => {
      const tr = document.querySelector('table tbody tr');
      return tr ? [...tr.querySelectorAll('td')].slice(0, 3).map((td) => td.innerText.trim()).join(' | ') : '';
    });
    console.log(`  tab "${label}": ${rows} rows${first ? '  e.g. ' + first : ''}`);
  }
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(2); });
