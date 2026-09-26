/**
 * DOM extraction: for each page, capture every table's header row + all data
 * rows as column-aligned arrays, plus non-table content (stats / log lines).
 * This is the "rendered" side of the API-vs-DOM cross-check.
 *
 * Run:  node dom-extract.js   (use the libuv>=1.52 node in tools/)
 */
'use strict';
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:80';

const PAGES = [
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
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  const out = {};

  for (const p of PAGES) {
    await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1800);

    const data = await page.evaluate(() => {
      const cellText = (el) => (el.innerText || '').replace(/\s+/g, ' ').trim();
      const result = { tables: [], stats: [], logLines: [], errors: [], empty: [] };
      // Tables: header + rows, column-aligned. Also capture badge classes.
      document.querySelectorAll('table').forEach((t) => {
        const headers = [...t.querySelectorAll('thead th')].map(cellText);
        const rows = [...t.querySelectorAll('tbody tr')].map((tr) =>
          [...tr.querySelectorAll('td')].map((td) => {
            const badge = td.querySelector('.badge');
            const txt = cellText(td);
            return badge ? `${txt}[cls:${badge.className}]` : txt;
          })
        );
        result.tables.push({ headers, rows });
      });
      // Stat cards (dashboard / system usage): value + label.
      document.querySelectorAll('.stat').forEach((s) => {
        const v = s.querySelector('.value');
        const l = s.querySelector('.label');
        if (v) result.stats.push({ value: cellText(v), label: l ? cellText(l) : '' });
      });
      // Log lines.
      document.querySelectorAll('.log-line').forEach((l) => {
        result.logLines.push(cellText(l));
      });
      // Error banners.
      document.querySelectorAll('.error').forEach((e) => result.errors.push(cellText(e)));
      // "No X" empty-state messages.
      document.querySelectorAll('.empty').forEach((e) => result.empty.push(cellText(e)));
      return result;
    });

    out[p.name] = data;
    // console summary
    console.log(`\n===== ${p.name} (${p.path}) =====`);
    data.tables.forEach((t, i) => {
      console.log(`  table[${i}] headers=[${t.headers.join(' | ')}]  rows=${t.rows.length}`);
      // show first 2 rows, flag empty cells
      t.rows.slice(0, 2).forEach((r, ri) => {
        const empties = r.map((c, ci) => (c === '' ? `#${ci}(${t.headers[ci] || '?'})=∅` : null)).filter(Boolean);
        console.log(`    row${ri}: [${r.join(' | ')}]${empties.length ? '   EMPTY: ' + empties.join(', ') : ''}`);
      });
    });
    if (data.stats.length) console.log(`  stats: ${data.stats.map((s) => `${s.label}=${s.value}`).join('  |  ')}`);
    if (data.logLines.length) console.log(`  logLines(${data.logLines.length}): ${data.logLines.slice(0, 4).join('  //  ')}`);
    if (data.errors.length) console.log(`  ERRORS: ${data.errors.join(' | ')}`);
    if (data.empty.length) console.log(`  emptyStates: ${data.empty.join(' | ')}`);
  }

  fs.writeFileSync(path.join(__dirname, 'out', 'dom-extract.json'), JSON.stringify(out, null, 2));
  console.log('\nwritten -> out/dom-extract.json');
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
