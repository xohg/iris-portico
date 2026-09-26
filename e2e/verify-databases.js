/**
 * Verify the new /databases page end-to-end in the live container:
 *  1. login (single attempt)
 *  2. list renders (rows + sample)
 *  3. row click -> config detail loads
 *  4. "Get runtime info" -> async task polled to finished, runtime table renders
 *  5. volumes table renders
 *  6. screenshot
 * Run:  node verify-databases.js
 */
'use strict';
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:80';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(BASE + '/databases', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    // login redirects to the dashboard; go to the target route
    await page.goto(BASE + '/databases', { waitUntil: 'networkidle', timeout: 30000 });
  }
  console.log('URL after login: ' + page.url());

  // 1. list
  await page.waitForTimeout(2000);
  const list = await page.evaluate(() => {
    const tables = [...document.querySelectorAll('table')];
    const t = tables[0];
    const rows = t ? [...t.querySelectorAll('tbody tr')] : [];
    return {
      tables: tables.length,
      rows: rows.length,
      sample: rows.slice(0, 4).map((tr) =>
        [...tr.querySelectorAll('td')].map((td) => td.innerText.trim().replace(/\s+/g, ' ')).join(' | ')),
      navHas: !![...document.querySelectorAll('a, [class*="nav"]')].find((a) => a.textContent.includes('Databases') || a.textContent.includes('数据库')),
    };
  });
  console.log('LIST: tables=' + list.tables + ' rows=' + list.rows + ' navItem=' + list.navHas);
  list.sample.forEach((s) => console.log('   ' + s));

  if (list.rows === 0) {
    console.log('FATAL: no database rows');
    await browser.close();
    process.exit(1);
  }

  // 2. click first row -> detail
  await page.click('table tbody tr');
  await page.waitForTimeout(2500);
  const detail = await page.evaluate(() => {
    const h3s = [...document.querySelectorAll('h3')].map((h) => h.textContent.trim());
    const detailCard = [...document.querySelectorAll('.card')].pop();
    return { h3s, textLen: detailCard ? detailCard.innerText.length : 0 };
  });
  console.log('DETAIL after click: h3s=' + JSON.stringify(detail.h3s) + ' textLen=' + detail.textLen);

  // 3. click "Get runtime info" (async task, ~10-20 s)
  const infoBtn = await page.$('button:has-text("Get runtime info"), button:has-text("获取运行时信息")');
  if (infoBtn) {
    await infoBtn.click();
    console.log('clicked info; waiting for async result...');
    await page.waitForTimeout(25000);
    const runtime = await page.evaluate(() => {
      const h3s = [...document.querySelectorAll('h3')].map((h) => h.textContent.trim());
      const hasRuntime = h3s.some((h) => /Runtime|运行时/.test(h));
      const notice = document.querySelector('.notice') ? document.querySelector('.notice').innerText : '';
      const err = document.querySelector('.error') ? document.querySelector('.error').innerText : '';
      // grab the runtime table rows if present
      const tables = [...document.querySelectorAll('table')];
      const rtTable = tables.find((t) => t.closest('.card') && t.innerText.match(/Block size|块大小/));
      const rows = rtTable ? [...rtTable.querySelectorAll('tbody tr')].map((tr) =>
        [...tr.querySelectorAll('td')].map((td) => td.innerText.trim()).join(' | ')) : [];
      return { hasRuntime, notice, err, rows };
    });
    console.log('RUNTIME: hasSection=' + runtime.hasRuntime);
    if (runtime.notice) console.log('  notice: ' + runtime.notice);
    if (runtime.err) console.log('  error: ' + runtime.err);
    runtime.rows.forEach((r) => console.log('   ' + r));
  } else {
    console.log('info button not found');
  }

  // 4. volumes (loaded on select)
  const vols = await page.evaluate(() => {
    const h3s = [...document.querySelectorAll('h3')].map((h) => h.textContent.trim());
    const has = h3s.some((h) => /Volumes|卷/.test(h));
    return has;
  });
  console.log('VOLUMES section: ' + vols);

  await page.screenshot({ path: 'out/databases.png', fullPage: true });
  console.log('screenshot: out/databases.png');

  console.log('JS errors: ' + (errors.length ? JSON.stringify(errors) : 'none'));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(2); });
