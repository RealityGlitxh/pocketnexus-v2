#!/usr/bin/env node
// Fails if anything that looks like a privileged credential is present in
// tracked source files or in the built client bundle (apps/web/dist).
//
// This is a guardrail, not a substitute for GitHub secret scanning / push
// protection, which should also be enabled on the repository.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS = [
  { name: 'Supabase secret key', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: 'service_role reference with JWT', re: /service_role["']?\s*[:=]\s*["']eyJ/ },
  {
    name: 'Postgres connection string with password',
    re: /postgres(?:ql)?:\/\/[^:\s'"]+:[^@\s'"]{6,}@/,
  },
  { name: 'OpenAI key', re: /(?<![A-Za-z0-9_-])sk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{32,}/ },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{30,}/ },
  {
    name: 'Cloudflare API token assignment',
    re: /CLOUDFLARE_API_TOKEN\s*=\s*['"]?[A-Za-z0-9_-]{30,}/,
  },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Legacy production Supabase project', re: /cdmzrsvwztndqfwzsumo\.supabase\.co/ },
];

// Files that legitimately mention the patterns as documentation/tests.
const ALLOW = [
  /^scripts\/check-no-secrets\.mjs$/,
  /^packages\/shared\/src\/config\/env(\.test)?\.ts$/,
  /^docs\//,
  /^\.env\.example$/,
  /^supabase\/config\.toml$/,
];

function trackedFiles() {
  try {
    return execSync('git ls-files -co --exclude-standard', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const findings = [];
function scan(file, allowList) {
  if (allowList.some((re) => re.test(file))) return;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) findings.push(`${file}: ${name}`);
  }
}

for (const f of trackedFiles()) scan(f, ALLOW);
if (existsSync('apps/web/dist')) for (const f of walk('apps/web/dist')) scan(f, []);

if (findings.length) {
  console.error('Potential secrets found:\n  ' + findings.join('\n  '));
  process.exit(1);
}
console.log('No secrets detected in source or build output.');
