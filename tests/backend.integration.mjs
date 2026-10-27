import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

import { backendConfig } from './backend-config.mjs';
const { ref, url, publicKey, serviceKey } = await backendConfig();
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const created = [];
const clients = [];
try {
  for (let i = 0; i < 2; i++) {
    const password = randomBytes(32).toString('base64url');
    const email = `todos-integration-${randomUUID()}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ifError(error); created.push(data.user.id);
    const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
    clients.push(client);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    assert.ifError(signedIn.error);
  }
  const [a, b] = clients;
  const id = randomUUID();
  const insert = await a.from('todos').insert({ id, user_id: created[0], title: 'Integration check' }).select().single();
  assert.ifError(insert.error);
  const foreignRead = await b.from('todos').select('*').eq('id', id);
  assert.ifError(foreignRead.error); assert.deepEqual(foreignRead.data, []);
  const foreignWrite = await b.from('todos').update({ title: 'Wrong user' }).eq('id', id).select();
  assert.ifError(foreignWrite.error); assert.deepEqual(foreignWrite.data, []);
  const foreignInsert = await b.from('todos').insert({ id: randomUUID(), user_id: created[0], title: 'Wrong owner' });
  assert.ok(foreignInsert.error);
  const anon = createClient(url, publicKey, { auth: { persistSession: false } });
  assert.ok((await anon.from('todos').select('*')).error);
  const channel = a.channel('integration-' + randomUUID());
  let postgresReady;
  const ready = new Promise(resolve => { postgresReady = resolve; });
  channel.on('system', {}, message => { if (message.status === 'ok' && message.extension === 'postgres_changes') postgresReady(); });
  let observed;
  const event = new Promise(resolve => { observed = resolve; });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'todos', filter: `user_id=eq.${created[0]}` }, payload => observed(payload));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Realtime subscription timeout')), 15000);
    channel.subscribe((status, error) => { console.log('Realtime status:', status, error?.message ?? ''); if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); } else if (status === 'CHANNEL_ERROR') { clearTimeout(timer); reject(Error(status)); } });
  });
  let readyDeadline;
  try {
    await Promise.race([ready, new Promise((_, reject) => { readyDeadline = setTimeout(() => reject(Error('Postgres subscription readiness timeout')), 15000); })]);
  } finally { clearTimeout(readyDeadline); }
  const update = await a.from('todos').update({ completed: true }).eq('id', id).select().single();
  assert.ifError(update.error); assert.equal(update.data.title, 'Integration check');
  let deadline;
  const payload = await Promise.race([event, new Promise((_, reject) => { deadline = setTimeout(() => reject(Error('Realtime update timeout')), 15000); })]);
  clearTimeout(deadline); assert.equal(payload.new.completed, true);
  await a.removeChannel(channel);
  const deleted = await a.from('todos').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();
  assert.ifError(deleted.error); assert.ok(deleted.data.deleted_at);
  console.log('PASS: authenticated CRUD, owner isolation, cross-user writes rejected, anonymous access denied, realtime updates, tombstones');
} finally {
  for (const client of clients) await client.removeAllChannels();
  for (const id of created) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw Error('Test-user cleanup failed: ' + error.message);
  }
  const { count, error } = await admin.from('todos').select('id', { count: 'exact', head: true });
  assert.ifError(error); console.log(`Cleanup complete. ${count} task rows remain.`);
}
