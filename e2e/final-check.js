// Final verification: (1) are the remaining empty cells privilege-gated action
// columns? (2) is tasks LastFinished genuinely empty or a field mismatch?
'use strict';
const BASE = 'http://localhost:80/api/admin';
const AUTH = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');
async function get(p) {
  const res = await fetch(BASE + p, { headers: { Authorization: AUTH } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  return d;
}
(async () => {
  // (1) What privileges does the logged-in user hold?
  const info = await get('/info');
  console.log('=== /info privileges ===');
  console.log('privileges:', JSON.stringify(info.privileges));
  console.log('username:', info.username);

  // (2) tasks LastFinished raw values
  const tasks = await get('/v2/tasks');
  console.log('\n=== tasks: LastFinished / NextScheduled raw values (first 6) ===');
  (Array.isArray(tasks) ? tasks : []).slice(0, 6).forEach((t) => {
    console.log(`  ${t.Name}: LastFinished=${JSON.stringify(t.LastFinished)}  NextScheduled=${JSON.stringify(t.NextScheduled)}`);
  });

  // (3) web-apps Enabled raw (to confirm the "off" badge is correct)
  const apps = await get('/v2/web-apps');
  console.log('\n=== web-apps: Enabled raw (first 4) ===');
  (Array.isArray(apps) ? apps : []).slice(0, 4).forEach((a) => {
    console.log(`  ${a.Name}: Enabled=${JSON.stringify(a.Enabled)}`);
  });
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
