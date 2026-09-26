#!/usr/bin/env node
/**
 * gen-types.js
 *
 * Generates framework-agnostic TypeScript types from the SysAdmin OpenAPI spec
 * (mainspec_v2.json). The output (../src/types/index.ts) is consumed by every
 * frontend variant (Angular / React / Vue) and by the API client.
 *
 * Usage:  node scripts/gen-types.js [path-to-spec] [path-to-output]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const specPath = process.argv[2] || path.join(__dirname, '..', '..', 'mainspec_v2.json');
const outPath = process.argv[3] || path.join(__dirname, '..', 'src', 'types', 'index.ts');

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const schemas = spec.components.schemas || {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function refName(ref) {
  return ref.split('/').pop();
}

function tsPrimitive(schema) {
  if (schema.enum) {
    const vals = schema.enum.map((v) => (typeof v === 'string' ? JSON.stringify(v) : String(v)));
    return vals.join(' | ');
  }
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return emitType(schema.items || {}) + '[]';
    case 'object':
      return emitType(schema);
    default:
      // no explicit type (e.g. free-form object / anyOf)
      return emitType(schema);
  }
}

/** Emit the TS expression for a (possibly inline) schema node. */
function emitType(schema) {
  if (!schema) return 'any';

  // $ref → named type
  if (schema.$ref) return refName(schema.$ref);

  // allOf → intersection
  if (schema.allOf) {
    const parts = schema.allOf.map((s) => emitType(s));
    // merge any inline properties defined alongside allOf
    if (schema.properties) {
      parts.push(emitInlineObject(schema));
    }
    return parts.length === 1 ? parts[0] : parts.map((p) => `(${p})`).join(' & ');
  }

  // anyOf / oneOf → union
  if (schema.anyOf || schema.oneOf) {
    const variants = (schema.anyOf || schema.oneOf).map((s) => emitType(s));
    return variants.length === 1 ? variants[0] : `(${variants.join(' | ')})`;
  }

  if (schema.type === 'array') {
    return emitType(schema.items || {}) + '[]';
  }

  if (schema.type === 'object' || schema.properties || schema.additionalProperties) {
    return emitInlineObject(schema);
  }

  if (schema.type === 'string' || schema.type === 'number' || schema.type === 'integer' || schema.type === 'boolean') {
    return tsPrimitive(schema);
  }

  // fallback
  return 'any';
}

function emitInlineObject(schema) {
  if (schema.additionalProperties && !schema.properties) {
    const valType = typeof schema.additionalProperties === 'object'
      ? emitType(schema.additionalProperties)
      : 'any';
    return `Record<string, ${valType}>`;
  }
  if (!schema.properties) return 'Record<string, any>';

  const req = new Set(schema.required || []);
  const lines = Object.entries(schema.properties).map(([name, prop]) => {
    const type = emitType(prop);
    const opt = req.has(name) ? '' : '?';
    const desc = prop.description ? ` /** ${cleanDesc(prop.description)} */ ` : '';
    return `  ${jsSafeKey(name)}${opt}: ${type};${desc}`;
  });
  return `{ ${lines.join(' ')} }`;
}

function cleanDesc(d) {
  return String(d).replace(/\*\//g, '* /').replace(/\n/g, ' ').slice(0, 200);
}

function jsSafeKey(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

// ---------------------------------------------------------------------------
// Emit each named schema
// ---------------------------------------------------------------------------

const names = Object.keys(schemas).sort();
const out = [];
out.push('/**');
out.push(' * Auto-generated from mainspec_v2.json by scripts/gen-types.js.');
out.push(' * DO NOT EDIT BY HAND — re-run:  npm run gen-types');
out.push(' *');
out.push(' * OpenAPI title: ' + spec.info.title + '  version: ' + spec.info.version);
out.push(' * Schemas: ' + names.length);
out.push(' */');
out.push('');

// Base envelope types first (referenced by many)
for (const name of names) {
  const s = schemas[name];
  out.push(emitNamed(name, s));
  out.push('');
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out.join('\n'));
console.log('Wrote ' + names.length + ' types → ' + outPath);

function emitNamed(name, s) {
  // Determine the "body" expression
  const body = emitType(s);
  // If the body is a plain inline object, emit as interface for readability
  if (body.startsWith('{ ') && !body.includes('&') && !body.includes('|')) {
    // convert inline object to interface
    return toInterface(name, s);
  }
  return `export type ${name} = ${body};`;
}

function toInterface(name, s) {
  const req = new Set(s.required || []);
  const lines = [];
  const props = s.properties || {};
  for (const [pname, prop] of Object.entries(props)) {
    const type = emitType(prop);
    const opt = req.has(pname) ? '' : '?';
    const desc = prop.description ? `/** ${cleanDesc(prop.description)} */\n  ` : '  ';
    lines.push(`${desc}${jsSafeKey(pname)}${opt}: ${type};`);
  }
  return `export interface ${name} {\n${lines.join('\n')}\n}`;
}
