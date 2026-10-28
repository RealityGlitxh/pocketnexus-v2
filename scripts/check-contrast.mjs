#!/usr/bin/env node
// Verifies WCAG 2.2 contrast for the semantic token pairs actually used by
// components, in both themes. Parses packages/ui/src/tokens/tokens.css.
// Usage: node scripts/check-contrast.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(
  fileURLToPath(new URL('../packages/ui/src/tokens/tokens.css', import.meta.url)),
  'utf8',
);

function block(selectorRegex) {
  const m = css.match(selectorRegex);
  if (!m) throw new Error(`Theme block not found: ${selectorRegex}`);
  const vars = {};
  for (const [, name, value] of m[1].matchAll(/--pn-([\w-]+):\s*([^;]+);/g))
    vars[name] = value.trim();
  return vars;
}

const themes = {
  dark: block(/:root,\s*\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/),
  light: block(/\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/),
};

function parse(color, bg) {
  let m = color.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = color.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/);
  if (m) {
    const a = Number(m[4]);
    const base = parse(bg);
    return [1, 2, 3].map((i, k) => Math.round(Number(m[i]) * a + base[k] * (1 - a)));
  }
  throw new Error(`Unsupported color ${color}`);
}

const lum = ([r, g, b]) => {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [foreground, background, minimum ratio, description]
const PAIRS = [
  ['fg', 'canvas', 4.5, 'body text'],
  ['fg', 'surface', 4.5, 'text on cards'],
  ['fg-muted', 'canvas', 4.5, 'secondary text'],
  ['fg-muted', 'surface', 4.5, 'secondary text on cards'],
  ['fg-muted', 'surface-overlay', 4.5, 'secondary text in dialogs'],
  ['fg-subtle', 'canvas', 4.5, 'tertiary text (used at small sizes)'],
  ['fg-subtle', 'surface', 4.5, 'tertiary text on cards'],
  ['fg-subtle', 'surface-sunken', 4.5, 'placeholders in inputs'],
  ['primary-fg', 'primary', 4.5, 'primary button label'],
  ['primary-fg', 'primary-hover', 4.5, 'primary button label (hover)'],
  ['primary-text', 'canvas', 4.5, 'violet links'],
  ['primary-text', 'surface', 4.5, 'violet links on cards'],
  ['accent-text', 'surface', 4.5, 'accent text'],
  ['success-text', 'surface', 4.5, 'success text'],
  ['warning-text', 'surface', 4.5, 'warning text'],
  ['danger-text', 'surface', 4.5, 'danger text'],
  ['danger-text', 'surface-overlay', 4.5, 'destructive menu item'],
  ['warning-text', 'warning-soft@surface', 4.5, 'warning badge'],
  ['primary-text', 'primary-soft@surface', 4.5, 'primary badge'],
  ['fg', 'primary-soft@surface', 4.5, 'active nav item'],
  ['border-input', 'surface-sunken', 3, 'input border on its own fill (non-text UI)'],
  ['border-input', 'surface', 3, 'input border against cards'],
  ['border-input', 'surface-overlay', 3, 'input border inside dialogs'],
  ['fg-subtle', 'surface-overlay', 4.5, 'nav "Soon" pill, dropdown labels'],
  ['fg-subtle', 'surface-raised', 4.5, 'subtle text on raised surfaces'],
  ['focus', 'canvas', 3, 'focus ring'],
];

let failed = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name} theme`);
  for (const [fg, bgSpec, min, desc] of PAIRS) {
    const [bgName, under] = bgSpec.split('@');
    const underColor = under ? parse(t[under]) : null;
    const bg = under
      ? parse(t[bgName], `#${underColor.map((v) => v.toString(16).padStart(2, '0')).join('')}`)
      : parse(t[bgName]);
    const r = ratio(parse(t[fg]), bg);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bgSpec} — ${desc}`,
    );
  }
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
console.log('\nAll contrast checks passed.');
