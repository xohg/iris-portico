// Verify no undeclared tmp_ variables remain in the built output (the original AOT bug).
'use strict';
const fs = require('fs');
const path = require('path');
const DIST = path.join(__dirname, '..', 'src', 'web', 'dist', 'portico-web');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(js|ts)$/.test(e.name)) yield p;
  }
}

let totalTmp = 0, undeclared = 0, files = 0;
for (const f of walk(DIST)) {
  files++;
  const src = fs.readFileSync(f, 'utf8');
  const tmpUses = [...src.matchAll(/\btmp_\d+_\d+\b/g)].length;
  const tmpLets = [...src.matchAll(/\b(?:let|const|var)\s+tmp_\d+_\d+\b/g)].length;
  totalTmp += tmpUses;
  if (tmpUses > tmpLets) {
    undeclared += tmpUses - tmpLets;
    console.log(`UNDECLARED in ${path.relative(DIST, f)}: uses=${tmpUses} declared=${tmpLets}`);
  }
}
console.log(`\nfiles=${files}  total tmp_ uses=${totalTmp}  undeclared=${undeclared}`);
console.log(undeclared === 0 ? 'OK: no undeclared tmp_ vars' : 'BUG: undeclared tmp_ vars present');
process.exit(undeclared === 0 ? 0 : 1);
