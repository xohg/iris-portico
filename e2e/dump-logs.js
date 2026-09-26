// Dump full nested structure of dashboard/main + audit records + journal files.
'use strict';
const BASE = 'http://localhost:80/api/admin';
const AUTH = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');
async function get(p, body) {
  const res = await fetch(BASE + p, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  return { status: res.status, data: d };
}
(async () => {
  const main = await get('/v2/monitor/dashboard/main');
  console.log('=== /v2/monitor/dashboard/main (full) ===');
  console.log(JSON.stringify(main.data, null, 2));
  const audit = await get('/v2/security/audit/records', {});
  console.log('\n=== /v2/security/audit/records (status ' + audit.status + ', count ' + (Array.isArray(audit.data) ? audit.data.length : 'n/a') + ') ===');
  const arr = Array.isArray(audit.data) ? audit.data : [];
  console.log('first item keys:', arr[0] ? Object.keys(arr[0]) : 'n/a');
  console.log('sample:', JSON.stringify(arr[0], null, 2));
  const files = await get('/v2/journal/files');
  console.log('\n=== /v2/journal/files (count ' + (Array.isArray(files.data) ? files.data.length : 'n/a') + ') ===');
  console.log('first item:', JSON.stringify((Array.isArray(files.data) ? files.data[0] : files.data), null, 2));
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
