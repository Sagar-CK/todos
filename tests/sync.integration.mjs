import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

import { backendConfig } from './backend-config.mjs';
const { ref, url, publicKey, serviceKey } = await backendConfig();
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const remote = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
const browser = `todos-sync-${process.pid}`;
const run = (...args) => execFileSync('agent-browser', ['--session', browser, ...args], { encoding: 'utf8', timeout: 30000 });
const evaluate = code => execFileSync('agent-browser', ['--session', browser, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 30000 });
const email = `todos-ui-${randomUUID()}@example.test`, password = randomBytes(32).toString('base64url');
let userId;
async function until(check, message) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw Error(message);
}
try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error); userId = created.data.user.id;
  const signedIn = await remote.auth.signInWithPassword({ email, password }); assert.ifError(signedIn.error);
  const session = signedIn.data.session;
  run('open', 'http://127.0.0.1:5186');
  evaluate(`(() => { window.__nativeSession = ${JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token })}; window.dispatchEvent(new Event('todos-auth')); return 'auth callback delivered'; })()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('sb-${ref}-auth-token') || 'null')?.user?.id === ${JSON.stringify(userId)}`).trim() === 'true', 'Browser did not sign in');
  run('find', 'label', 'New task', 'fill', 'Synced from the app'); run('press', 'Enter');
  let id;
  await until(async () => { const { data } = await remote.from('todos').select('*').eq('title', 'Synced from the app'); id = data?.[0]?.id; return !!id; }, 'App task did not reach Supabase');
  const edited = await remote.from('todos').update({ title: 'Changed from the other device' }).eq('id', id); assert.ifError(edited.error);
  await until(() => evaluate("document.body.innerText.includes('Changed from the other device')").trim() === 'true', 'Remote update did not reach the UI');
  run('set', 'offline', 'on');
  run('find', 'label', 'New task', 'fill', 'Created offline'); run('press', 'Enter');
  assert.equal(evaluate(`JSON.parse(localStorage.getItem('sagar-todos:v1:${userId}')).pending.length > 0`).trim(), 'true');
  run('set', 'offline', 'off');
  await until(async () => (await remote.from('todos').select('id').eq('title', 'Created offline')).data?.length === 1, 'Offline task was not replayed');
  run('reload');
  await until(() => evaluate("document.body.innerText.includes('Created offline')").trim() === 'true', 'Task did not survive reload');
  console.log('PASS: real app sign-in, app-to-cloud writes, remote-to-app changes, durable offline queue, reconnect replay, reload persistence');
} finally {
  try { run('close'); } catch { /* Clean up the account even if the browser failed. */ }
  if (userId) { const { error } = await admin.auth.admin.deleteUser(userId); if (error) throw error; }
  await remote.removeAllChannels();
  console.log('Temporary UI account and its tasks removed.');
}
