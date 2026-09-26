/**
 * API ground truth: call every endpoint the portal uses, using Basic auth
 * (exactly what the running app does). Reports, per endpoint:
 *   - HTTP status
 *   - shape (array | object)
 *   - count (array length)
 *   - a sample of real field values (to cross-check against the DOM)
 *
 * Pure Node (no browser) -> no libuv crash risk.
 * Run:  node api-ground-truth.js   (any node; uses global fetch)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:80/api/admin';
const USER = 'Portico';
const PASS = 'Portico123';
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

// Endpoint groups keyed by the page that consumes them.
const GROUPS = {
  dashboard: [
    ['GET', '/info', []],
    ['GET', '/v2/web-apps', []],
    ['GET', '/v2/security/users', []],
    ['GET', '/v2/security/roles', []],
    ['GET', '/v2/tasks', []],
    ['GET', '/v2/monitor/dashboard/main', []],
  ],
  webapps: [
    ['GET', '/v2/web-apps', []],
    ['GET', '/v2/web-sessions', []],
    ['GET', '/v2/namespaces', []],
  ],
  permissions: [
    ['GET', '/v2/security/users', []],
    ['GET', '/v2/security/roles', []],
    ['GET', '/v2/security/resources', []],
    ['GET', '/v2/security/services', []],
    ['GET', '/v2/security/sql-privileges', []],
    ['GET', '/v2/security/web-auth', []],
  ],
  security: [
    ['GET', '/v2/wallet/collections', []],
    ['GET', '/v2/security/x509-credentials', []],
    ['GET', '/v2/security/oauth2/client/server-definitions', []],
    ['GET', '/v2/security/oauth2/server/clients', []],
    ['GET', '/v2/security/oauth2/resource-servers', []],
    ['GET', '/v2/security/ssl-configurations', []],
    ['GET', '/v2/security/encryption/settings', []],
    ['GET', '/v2/security/mft/connections', []],
    ['GET', '/v2/security/ldap/configurations', []],
    ['GET', '/v2/security/superservers', []],
  ],
  tasks: [
    ['GET', '/v2/tasks', []],
    ['GET', '/v2/task/history', []],
    ['GET', '/v2/task/upcoming', []],
    ['GET', '/v2/task/manager', []],
  ],
  system: [
    ['GET', '/v2/processes', []],
    ['GET', '/v2/devices', []],
    ['GET', '/v2/monitor/system-usage', []],
    ['GET', '/v2/locks', []],
    ['GET', '/v2/databases', []],
  ],
  logs: [
    ['GET', '/v2/monitor/dashboard/main', []],
    ['POST', '/v2/security/audit/records', [{}]],
    ['GET', '/v2/journal/files', []],
  ],
  async: [
    ['GET', '/v2/async-results', []],
  ],
};

function shapeOf(data) {
  if (Array.isArray(data)) return { kind: 'array', count: data.length };
  if (data && typeof data === 'object') return { kind: 'object', keys: Object.keys(data) };
  return { kind: typeof data, value: data };
}

// Pick a few representative scalar fields from an item for sampling.
function sampleFields(item, n = 3) {
  if (!item || typeof item !== 'object') return [String(item)];
  const out = [];
  for (const [k, v] of Object.entries(item)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out.push(`${k}=${v}`);
    }
    if (out.length >= n) break;
  }
  return out;
}

async function call(method, p, body) {
  const url = BASE + p;
  const init = { method, headers: { Authorization: AUTH, 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  let data;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  // Unwrap the BaseResponse envelope -> result.
  if (data && typeof data === 'object' && 'result' in data) data = data.result;
  return { status: res.status, data };
}

(async () => {
  const report = {};
  let okCount = 0, warnCount = 0, errCount = 0;

  for (const [group, eps] of Object.entries(GROUPS)) {
    report[group] = [];
    for (const [method, p, body] of eps) {
      let r;
      try {
        r = await call(method, p, body[0]);
      } catch (e) {
        report[group].push({ endpoint: `${method} ${p}`, status: 'EXC', error: e.message });
        errCount++;
        continue;
      }
      const entry = { endpoint: `${method} ${p}`, status: r.status };
      if (r.status >= 400) {
        entry.problem = 'HTTP ' + r.status;
        entry.body = JSON.stringify(r.data).slice(0, 200);
        errCount++;
      } else {
        const s = shapeOf(r.data);
        entry.shape = s.kind;
        if (s.kind === 'array') {
          entry.count = s.count;
          if (s.count > 0) {
            entry.sample = sampleFields(r.data[0]);
            entry.firstKeys = Object.keys(r.data[0]);
          }
        } else if (s.kind === 'object') {
          entry.keys = s.keys;
          entry.sample = sampleFields(r.data, 6);
        } else {
          entry.value = s.value;
        }
        if (s.kind === 'array' && s.count === 0) { warnCount++; entry.note = 'empty array'; }
        else okCount++;
      }
      report[group].push(entry);
    }
  }

  // ---------- pretty print ----------
  console.log('================ API GROUND TRUTH ================');
  for (const [group, entries] of Object.entries(report)) {
    console.log(`\n### ${group}`);
    for (const e of entries) {
      let line = `  [${e.status}] ${e.endpoint}`;
      if (e.problem) line += `  -> ${e.problem}`;
      else if (e.shape === 'array') line += `  -> ${e.count} items${e.note ? ' (' + e.note + ')' : ''}`;
      else if (e.shape === 'object') line += `  -> object{${e.keys.join(',')}}`;
      else line += `  -> ${JSON.stringify(e.value)}`;
      console.log(line);
      if (e.sample && e.sample.length) console.log(`         sample: ${e.sample.join('  |  ')}`);
      if (e.body) console.log(`         body: ${e.body}`);
    }
  }
  console.log(`\nSUMMARY: ${okCount} ok, ${warnCount} empty, ${errCount} error`);

  // persist for the comparison step
  fs.writeFileSync(path.join(__dirname, 'out', 'ground-truth.json'), JSON.stringify(report, null, 2));
  console.log('written -> out/ground-truth.json');
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
