import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateConfig } from '../scripts/config.mjs';
test('empty configuration runs locally without a shared backend', () => {
  const config = validateConfig({});
  assert.equal(config.url, ''); assert.equal(config.apiKey, '');
});
test('rejects partial configuration and privileged keys before bundling', () => {
  const env = { VITE_SUPABASE_URL: 'https://example.supabase.co' };
  assert.throws(() => validateConfig(env), /both/);
  assert.throws(() => validateConfig({ ...env, VITE_SUPABASE_ANON_KEY: 'sb_secret_private' }), /never a secret/);
  const jwt = 'eyJ.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.signature';
  assert.throws(() => validateConfig({ ...env, VITE_SUPABASE_ANON_KEY: jwt }), /never a service-role/);
});
test('one configuration controls native identifiers and public backend', () => {
  const config = validateConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_example', TODOS_BUNDLE_ID: 'net.example.tasks', TODOS_URL_SCHEME: 'mytasks', TODOS_DEVELOPMENT_TEAM: 'ABCDE12345' });
  assert.equal(config.appGroup, 'group.net.example.tasks');
  assert.equal(config.urlScheme, 'mytasks'); assert.equal(config.team, 'ABCDE12345');
});
