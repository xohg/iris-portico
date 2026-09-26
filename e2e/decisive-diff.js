// DECISIVE: capture browser's actual outgoing request headers + full response
// (headers + raw body), and Node's full response, at the same moment. Diff them.
'use strict';
const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:80/api/admin';
const BASIC = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const netLog = [];
  page.on('request', (req) => {
    if (req.url().includes('/v2/web-apps')) netLog.push({ url: req.url(), method: req.method(), headers: req.headers() });
  });

  await page.goto('http://localhost:80/webapps', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(2000);

  // Browser raw fetch — capture full response headers + raw body
  const b = await page.evaluate(async () => {
    const auth = 'Basic ' + btoa(unescape(encodeURIComponent('Portico:Portico123')));
    const res = await fetch('/api/admin/v2/web-apps', { headers: { Authorization: auth, Accept: 'application/json' } });
    const hdrs = {};
    res.headers.forEach((v, k) => { hdrs[k] = v; });
    const body = await res.text();
    return { status: res.status, headers: hdrs, body };
  });

  // Node raw fetch — full response headers + raw body (same instant)
  const nRes = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: BASIC, Accept: 'application/json' } });
  const nHeaders = {};
  nRes.headers.forEach((v, k) => { nHeaders[k] = v; });
  const nBody = await nRes.text();

  console.log('=== BROWSER outgoing request (from Playwright) ===');
  (netLog[0] ? netLog[0].headers : 'none captured');
  console.log(JSON.stringify(netLog[0] ? netLog[0].headers : {}, null, 2));

  console.log('\n=== BROWSER response headers ===');
  console.log(JSON.stringify(b.headers, null, 2));
  console.log('=== NODE response headers ===');
  console.log(JSON.stringify(nHeaders, null, 2));

  // Compare bodies: find first differing app
  const bp = JSON.parse(b.body), np = JSON.parse(nBody);
  const bArr = bp && 'result' in bp ? bp.result : bp;
  const nArr = np && 'result' in np ? np.result : np;
  console.log('\n=== body diff (first 3) ===');
  const max = Math.max(bArr.length, nArr.length);
  for (let i = 0; i < Math.min(3, max); i++) {
    const bo = bArr[i], no = nArr[i];
    const diffKeys = Object.keys(bo || {}).filter((k) => JSON.stringify(bo[k]) !== JSON.stringify(no[k]));
    console.log(`  ${bo && bo.Name}: browser=${JSON.stringify(bo.Enabled)}  node=${JSON.stringify(no.Enabled)}  diffKeys=[${diffKeys}]`);
  }
  console.log('\nbody lengths: browser=' + b.body.length + '  node=' + nBody.length);
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
