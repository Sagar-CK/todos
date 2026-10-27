import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

if (process.platform !== 'darwin') throw Error('Build the Mac release on macOS.');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('status', '--porcelain')) throw Error('Commit the release changes before packaging.');
const commit = git('rev-parse', 'HEAD');
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const folder = resolve('build/release');
mkdirSync(folder, { recursive: true });
const temporary = mkdtempSync(join(tmpdir(), 'todos-public-release-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(VITE_|SUPABASE_|TODOS_)/.test(key)));
Object.assign(env, {
  VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '',
  TODOS_BUNDLE_ID: 'io.github.sagar-ck.todos', TODOS_URL_SCHEME: 'todos',
  TODOS_DEVELOPMENT_TEAM: '',
});
const run = (command, args, cwd = temporary) => execFileSync(command, args, { cwd, env, stdio: 'inherit' });
try {
  // Git's archive excludes ignored personal settings, generated bundles, and sessions.
  const archive = execFileSync('git', ['archive', '--format=tar', commit], { maxBuffer: 128 * 1024 * 1024 });
  execFileSync('tar', ['-xf', '-', '-C', temporary], { input: archive });
  run('npm', ['ci']);
  run('npm', ['test']);
  run('npm', ['run', 'mac:build']);
  const config = readFileSync(join(temporary, 'native/Shared/BackendConfig.swift'), 'utf8');
  if (!config.includes('static let apiKey = ""') || !config.includes('https://example.invalid')) throw Error('Public release must have no backend configured.');
  const app = join(folder, 'Todos.app');
  run('ditto', [join(temporary, 'build/Todos.app'), app]);
  run('codesign', ['--verify', '--deep', '--strict', app]);
  const architecture = execFileSync('lipo', ['-archs', join(app, 'Contents/MacOS/Todos')], { encoding: 'utf8' }).trim().replaceAll(' ', '-');
  const filename = `Todos-${version}-macOS-${architecture}.zip`;
  run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, join(folder, filename)]);
  const sha256 = createHash('sha256').update(readFileSync(join(folder, filename))).digest('hex');
  writeFileSync(join(folder, 'SHA256SUMS.txt'), `${sha256}  ${filename}\n`);
  writeFileSync(join(folder, 'release-manifest.json'), JSON.stringify({ version, commit, filename, sha256, architecture, minimumMacOS: '14.0', bundleIdentifier: 'io.github.sagar-ck.todos.mac', backend: 'local-only', signing: 'ad-hoc', notarized: false }, null, 2) + '\n');
  console.log(`Public release ready: ${join(folder, filename)}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
