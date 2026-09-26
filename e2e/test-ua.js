// Test: does a browser-like User-Agent change the /v2/web-apps response?
'use strict';
const BASE = 'http://localhost:80/api/admin';
const BASIC = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

async function listApps(headers) {
  const res = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: BASIC, Accept: 'application/json', ...headers } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  const arr = Array.isArray(d) ? d : [];
  return { status: res.status, first3: arr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`) };
}

(async () => {
  console.log('no UA:        ', JSON.stringify(await listApps({})));
  console.log('node UA:      ', JSON.stringify(await listApps({ 'User-Agent': 'node' })));
  console.log('browser UA:   ', JSON.stringify(await listApps({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' })));
  console.log('browser UA+Origin: ', JSON.stringify(await listApps({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', Origin: 'http://localhost:80', Referer: 'http://localhost:80/' })));
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
