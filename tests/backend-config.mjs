import { execFileSync } from 'node:child_process';
import { readConfig } from '../scripts/config.mjs';

export async function backendConfig() {
  const config = readConfig();
  if (!config.url || !config.apiKey) throw Error('Configure your own backend in .env.local before running integration tests.');
  const host = new URL(config.url).hostname;
  const ref = host.endsWith('.supabase.co') ? host.split('.')[0] : process.env.SUPABASE_PROJECT_REF;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    if (!ref) throw Error('Set SUPABASE_SERVICE_ROLE_KEY in the test process for a custom Supabase host.');
    const token = process.env.SUPABASE_ACCESS_TOKEN || execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w'], { encoding: 'utf8' }).trim();
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw Error(`Could not load integration-test credentials (${response.status}).`);
    serviceKey = (await response.json()).find(key => key.name === 'service_role')?.api_key;
  }
  if (!serviceKey) throw Error('Integration tests need a service-role key in the test process only.');
  return { ref, url: config.url, publicKey: config.apiKey, serviceKey };
}
