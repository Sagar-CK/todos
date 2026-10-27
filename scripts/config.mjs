import { loadEnv } from 'vite';

export function readConfig(mode = 'production', directory = process.cwd()) {
  return validateConfig({ ...loadEnv(mode, directory, ''), ...process.env });
}

export function validateConfig(env) {
  const url = (env.VITE_SUPABASE_URL || '').trim();
  const apiKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (Boolean(url) !== Boolean(apiKey)) throw Error('Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or leave both empty for local use.');
  if (url && !/^https?:\/\//.test(url)) throw Error('VITE_SUPABASE_URL must be an HTTP(S) URL.');
  if (url) new URL(url);
  if (apiKey.startsWith('sb_secret_')) throw Error('Use a publishable or anon key, never a secret key.');
  if (apiKey.startsWith('eyJ')) {
    let role;
    try { role = JSON.parse(Buffer.from(apiKey.split('.')[1], 'base64url').toString()).role; }
    catch { throw Error('Invalid Supabase client JWT.'); }
    if (role !== 'anon') throw Error('Use an anon key, never a service-role key.');
  }
  const bundleID = env.TODOS_BUNDLE_ID || 'com.example.todos';
  const urlScheme = env.TODOS_URL_SCHEME || 'todos';
  const team = env.TODOS_DEVELOPMENT_TEAM || '';
  if (!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(bundleID)) throw Error('TODOS_BUNDLE_ID must be a reverse-domain identifier.');
  if (!/^[a-z][a-z0-9+.-]*$/.test(urlScheme)) throw Error('TODOS_URL_SCHEME must be a lowercase URL scheme.');
  if (team && !/^[A-Z0-9]{10}$/.test(team)) throw Error('TODOS_DEVELOPMENT_TEAM must be your 10-character Apple team ID.');
  return { url, apiKey, bundleID, urlScheme, team, appGroup: `group.${bundleID}` };
}
