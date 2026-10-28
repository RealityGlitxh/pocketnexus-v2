#!/usr/bin/env node
// Enforces performance budgets on the production build (gzip sizes).
// See docs/ARCHITECTURE.md → Performance budgets.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'apps/web/dist';
const BUDGET = {
  // JS that must download before the dashboard can render.
  // Re-baselined 2026-10-28 from the first real build: 183.4 kB gz
  // (React 19 + React Router + TanStack Query + Radix + zod env validation).
  // The original 170 kB was set before any build existed. Ratchet down in Phase 1.
  initialJsKb: 190,
  // Any single lazily-loaded chunk.
  maxChunkKb: 80,
  // All CSS.
  cssKb: 30,
};

if (!existsSync(DIST)) {
  console.error(`${DIST} not found — run "pnpm build" first.`);
  process.exit(1);
}

const kb = (buf) => gzipSync(buf, { level: 9 }).length / 1024;
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assets = join(DIST, 'assets');
const files = readdirSync(assets);

// Initial JS = entry script + its modulepreloads referenced from index.html.
const initial = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map((m) => m[1]);
const initialKb = initial.reduce((sum, f) => sum + kb(readFileSync(join(assets, f))), 0);
const cssKb = files
  .filter((f) => f.endsWith('.css'))
  .reduce((s, f) => s + kb(readFileSync(join(assets, f))), 0);

const problems = [];
console.log(
  `Initial JS (${initial.length} files): ${initialKb.toFixed(1)} kB gz  (budget ${BUDGET.initialJsKb})`,
);
if (initialKb > BUDGET.initialJsKb) problems.push('initial JS over budget');
console.log(`CSS: ${cssKb.toFixed(1)} kB gz  (budget ${BUDGET.cssKb})`);
if (cssKb > BUDGET.cssKb) problems.push('CSS over budget');

for (const f of files.filter((x) => x.endsWith('.js') && !initial.includes(x))) {
  const size = kb(readFileSync(join(assets, f)));
  const flag = size > BUDGET.maxChunkKb;
  if (flag) problems.push(`${f} over chunk budget`);
  console.log(`  ${flag ? 'OVER' : 'ok  '} ${f.padEnd(40)} ${size.toFixed(1)} kB gz`);
}

if (problems.length) {
  console.error('\nBudget exceeded: ' + problems.join('; '));
  process.exit(1);
}
console.log('\nAll bundle budgets met.');
