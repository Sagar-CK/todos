import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { validateConfig } from './config.mjs';
const ref = process.argv[2] || process.env.SUPABASE_PROJECT_REF;
if (!ref || !/^[a-z0-9]{20}$/.test(ref)) throw Error('Usage: node scripts/configure-client.mjs YOUR_PROJECT_REF (after supabase login)');
// The CLI also returns privileged keys. Capture its output; never print them.
const keys = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', ref, '--output', 'json'], { encoding: 'utf8' }));
const apiKey = keys.find(item => item.name === 'anon')?.api_key;
if (!apiKey) throw Error('No anon key returned. Copy your publishable key into .env.local instead.');
const env = { VITE_SUPABASE_URL: `https://${ref}.supabase.co`, VITE_SUPABASE_ANON_KEY: apiKey };
validateConfig(env);
let content = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : readFileSync('.env.example', 'utf8');
for (const [key, value] of Object.entries(env)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  content = pattern.test(content) ? content.replace(pattern, () => line) : content + '\n' + line + '\n';
}
writeFileSync('.env.local', content, { mode: 0o600 }); chmodSync('.env.local', 0o600);
console.log('Updated public backend settings in .env.local; native identifiers were preserved.');
