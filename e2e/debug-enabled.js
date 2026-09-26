// Investigate the web-apps Enabled discrepancy: dump the raw list items exactly
// as the client returns them (post envelope-unwrap), and test coalesce() on them.
'use strict';
const BASE = 'http://localhost:80/api/admin';
const AUTH = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

// coalesce — same semantics as src/app/core/coalesce.ts
function coalesce(...values) {
  for (const v of values) if (v !== null && v !== undefined) return v;
  return undefined;
}

async function get(p) {
  const res = await fetch(BASE + p, { headers: { Authorization: AUTH } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  return d;
}

(async () => {
  const apps = await get('/v2/web-apps');
  const arr = Array.isArray(apps) ? apps : [];
  console.log(`web-apps: ${arr.length} items`);
  console.log('\n=== first 5 items: raw Enabled + coalesce result ===');
  arr.slice(0, 5).forEach((a) => {
    const c = coalesce(a.Enabled, a.enabled);
    console.log(`  ${a.Name}: Enabled=${JSON.stringify(a.Enabled)} (type ${typeof a.Enabled})  -> coalesce=${JSON.stringify(c)}  -> badge="${c ? 'on' : 'off'}"`);
  });
  // Also check: does the raw (pre-unwrap) envelope have a different shape?
  const raw = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: AUTH } });
  const rawText = await raw.text();
  const rawJson = JSON.parse(rawText);
  console.log('\n=== raw envelope top-level keys ===');
  console.log(Object.keys(rawJson));
  if (rawJson.result && Array.isArray(rawJson.result)) {
    console.log('result[0] keys:', Object.keys(rawJson.result[0]));
    console.log('result[0].Enabled:', JSON.stringify(rawJson.result[0].Enabled));
  }
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
