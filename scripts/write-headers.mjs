#!/usr/bin/env node
// Fills the Supabase origin into dist/_headers (CSP connect-src / img-src)
// for the environment being deployed. Run after `pnpm build`.
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'apps/web/dist/_headers';
const url = process.env.VITE_SUPABASE_URL?.trim();

let origin = '';
let wsOrigin = '';
if (url) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('VITE_SUPABASE_URL must be https');
  origin = u.origin;
  wsOrigin = `wss://${u.host}`;
}

const out = readFileSync(file, 'utf8')
  .replaceAll('__SUPABASE_ORIGIN__', origin)
  .replaceAll('__SUPABASE_WS_ORIGIN__', wsOrigin);

if (out.includes('__SUPABASE')) throw new Error('Unreplaced placeholder in _headers');
writeFileSync(file, out);
console.log(`_headers written (Supabase origin: ${origin || 'none'})`);
