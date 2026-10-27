import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { readConfig } from './config.mjs';

const config = readConfig();
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw Error('Commit changes before preparing a handoff.');
const output = resolve(process.argv[2] || `build/handoff/Todos-iPhone-Handoff-${version}.zip`);
mkdirSync(dirname(output), { recursive: true });
execFileSync('npm', ['run', 'ios:prepare'], { stdio: 'inherit' });
const temporary = mkdtempSync(join(tmpdir(), 'todos-handoff-'));
const folder = join(temporary, 'Todos-iPhone-Handoff');
mkdirSync(folder);
try {
  execFileSync('tar', ['-xf', '-', '-C', folder], { input: execFileSync('git', ['archive', '--format=tar', commit], { maxBuffer: 128 * 1024 * 1024 }) });
  for (const path of ['native/Shared/BackendConfig.swift', 'native/Shared/TodoTheme.swift', 'native/ios/Todos.xcodeproj', 'native/ios/project.generated.yml', 'native/ios/Info.plist', 'native/ios/WidgetInfo.plist', 'native/ios/Todos.entitlements', 'native/ios/TodosWidget.entitlements', 'native/ios/Resources']) {
    cpSync(path, join(folder, path), { recursive: true, filter: source => !source.includes('/xcuserdata') });
  }
  // Include only client build settings, never CLI credentials, user sessions, or database passwords.
  const client = { VITE_SUPABASE_URL: config.url, VITE_SUPABASE_ANON_KEY: config.apiKey, TODOS_BUNDLE_ID: config.bundleID, TODOS_URL_SCHEME: config.urlScheme, TODOS_DEVELOPMENT_TEAM: config.team };
  writeFileSync(join(folder, '.env.local'), Object.entries(client).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 });
  writeFileSync(join(folder, 'START-HERE.md'), `# Todos iPhone handoff\n\nVersion ${version}, source commit ${commit}.\n\nThe Xcode project, embedded UI, widget, fonts, icons, and your Supabase client configuration are already prepared. No Node installation is needed just to open and run this snapshot.\n\n1. Open native/ios/Todos.xcodeproj in Xcode on the other Mac.\n2. Add your Apple account in Xcode Settings → Accounts. Select a signing team for both Todos and TodosWidget. Keep automatic signing enabled.\n3. Keep bundle IDs ${config.bundleID} and ${config.bundleID}.widget, App Group ${config.appGroup}, and the generated shared Keychain group. The signing team must support these capabilities.\n4. Connect and trust your iPhone, enable Developer Mode when prompted, choose the phone and the Todos scheme, then Run.\n5. Sign in with the same email as your Mac, opening its magic link on your phone. Callback: ${config.urlScheme}://auth.\n6. Long-press the Home Screen, choose Edit → Add Widget, search Todos, and add a widget.\n\nSee docs/IPHONE_HANDOFF.md for the device QA and TestFlight steps. This ZIP includes personal client configuration; keep it off public releases. It contains no saved todos, login sessions, signing keys, management tokens, or database passwords.\n\nFor further development, clone https://github.com/Sagar-CK/todos, copy this folder’s .env.local into the checkout, run npm ci and npm run ios:prepare.\n`);
  execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', folder, output]);
  chmodSync(output, 0o600);
  console.log(`Private handoff ready: ${output}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
