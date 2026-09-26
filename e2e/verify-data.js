/**
 * Data-rendering verification: for each route, count table rows and sample cell text.
 * Proves the pages actually render API data (not just the page chrome).
 * Run:  node verify-data.js   (use a Node with libuv >= 1.52, e.g. node24)
 */
'use strict';
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:80';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

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
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  const results = [];
  for (const r of ROUTES) {
    await page.goto(BASE + r.path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const data = await page.evaluate(() => {
      const tables = [...document.querySelectorAll('table')];
      const out = { tables: [], cards: 0, badges: 0, textLen: 0 };
      for (const t of tables) {
        const rows = t.querySelectorAll('tbody tr').length;
        const firstCells = [...t.querySelectorAll('tbody tr')].slice(0, 3)
          .map((tr) => [...tr.querySelectorAll('td')].slice(0, 3).map((td) => td.innerText.trim()).join(' | '));
        out.tables.push({ rows, sample: firstCells });
      }
      out.cards = document.querySelectorAll('.card').length;
      out.badges = document.querySelectorAll('.badge').length;
      const main = document.querySelector('main, app-root');
      out.textLen = main ? main.innerText.length : 0;
      return out;
    });
    results.push({ name: r.name, ...data });
  }

  console.log('================ DATA RENDERING ================');
  let allData = true;
  for (const r of results) {
    const totalRows = r.tables.reduce((s, t) => s + t.rows, 0);
    const hasData = totalRows > 0 || r.cards > 0;
    if (!hasData) allData = false;
    console.log(`\n[${hasData ? 'DATA' : 'EMPTY'}] ${r.name}`);
    console.log(`   tables=${r.tables.length} totalRows=${totalRows} cards=${r.cards} badges=${r.badges} textLen=${r.textLen}`);
    for (const t of r.tables) {
      console.log(`   table: ${t.rows} rows`);
      t.sample.forEach((s) => console.log(`     e.g. ${s}`));
    }
  }
  console.log(`\nRESULT: ${allData ? 'ALL PAGES RENDER DATA' : 'SOME PAGES EMPTY'} (${results.filter((r) => r.tables.reduce((s, t) => s + t.rows, 0) > 0 || r.cards > 0).length}/${results.length})`);

  await browser.close();
  process.exit(allData ? 0 : 1);
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(2); });
