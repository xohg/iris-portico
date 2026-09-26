// Poll /v2/web-apps Enabled over time, from BOTH browser and Node, in parallel.
// Determines whether Enabled flaps (state/time-dependent) or is stable per-client.
'use strict';
const { chromium } = require('playwright-core');
const BASE = 'http://localhost:80/api/admin';
const BASIC = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

function summarize(d) {
  const arr = Array.isArray(d) ? d : (d && 'result' in d ? d.result : []);
  const on = arr.filter((a) => a.Enabled).length;
  return `on=${on}/${arr.length}  first3=[${arr.slice(0, 3).map((a) => a.Enabled ? 1 : 0).join('')}]`;
}

async function nodePoll() {
  const res = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: BASIC, Accept: 'application/json' } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  return summarize(d);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:80/webapps', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
  }

  const rows = [];
  for (let i = 0; i < 8; i++) {
    const t = new Date().toISOString().slice(11, 19);
    const b = await page.evaluate(async () => {
      const res = await fetch('/api/admin/v2/web-apps', { headers: { Authorization: 'Basic ' + btoa(unescape(encodeURIComponent('Portico:Portico123'))), Accept: 'application/json' } });
      let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
      if (d && typeof d === 'object' && 'result' in d) d = d.result;
      const arr = Array.isArray(d) ? d : [];
      return `on=${arr.filter((a) => a.Enabled).length}/${arr.length}  first3=[${arr.slice(0, 3).map((a) => a.Enabled ? 1 : 0).join('')}]`;
    });
    const n = await nodePoll();
    rows.push(`t=${t}  browser=${b}   node=${n}`);
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log('=== time series (browser vs node) ===');
  rows.forEach((r) => console.log(r));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
