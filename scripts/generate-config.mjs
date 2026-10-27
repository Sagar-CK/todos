import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readConfig } from './config.mjs';

const config = readConfig();
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
// These generated files are ignored. Only the public client key is embedded.
const swiftString = value => JSON.stringify(value);
writeFileSync('native/Shared/BackendConfig.swift', `// Generated from .env.local. Do not commit.\nimport Foundation\nenum BackendConfig {\n${Object.entries({ url: config.url || 'https://example.invalid', apiKey: config.apiKey, bundleID: config.bundleID, urlScheme: config.urlScheme, appGroup: config.appGroup }).map(([name, value]) => `    static let ${name} = ${name === 'url' ? `URL(string: ${swiftString(value)})!` : swiftString(value)}`).join('\n')}\n}\n`);
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
mkdirSync('build', { recursive: true });
writeFileSync('build/MacInfo.plist', `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n${Object.entries({ CFBundleIdentifier: config.bundleID + '.mac', CFBundleName: 'Todos', CFBundleExecutable: 'Todos', CFBundlePackageType: 'APPL', CFBundleShortVersionString: version, CFBundleVersion: '1', LSMinimumSystemVersion: '14.0' }).map(([key, value]) => `<key>${key}</key><string>${xml(value)}</string>`).join('\n')}\n<key>LSUIElement</key><true/><key>NSHighResolutionCapable</key><true/>\n<key>CFBundleURLTypes</key><array><dict><key>CFBundleURLName</key><string>${config.bundleID}.auth</string><key>CFBundleURLSchemes</key><array><string>${config.urlScheme}</string></array></dict></array>\n</dict></plist>\n`);
writeFileSync('native/ios/project.generated.yml', readFileSync('native/ios/project.yml', 'utf8')
  .replaceAll('__BUNDLE_ID__', config.bundleID)
  .replaceAll('__URL_SCHEME__', config.urlScheme)
  .replaceAll('__DEVELOPMENT_TEAM__', config.team)
  .replaceAll('__VERSION__', version));
console.log(config.url ? 'Generated native configuration for your backend.' : 'Generated local-only configuration.');
