import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const source = readFileSync('components/graphical/theme.ts', 'utf8');
const document = JSON.parse(source.slice(source.indexOf('= {') + 2).trim().replace(/;$/, ''));
const theme = document.theme;
const swiftColor = value => {
  const hex = value.replace('#', '');
  return `Color(red: ${parseInt(hex.slice(0, 2), 16)} / 255.0, green: ${parseInt(hex.slice(2, 4), 16)} / 255.0, blue: ${parseInt(hex.slice(4, 6), 16)} / 255.0)`;
};
writeFileSync('native/Shared/TodoTheme.swift', `// Generated from components/graphical/theme.ts by scripts/native-assets.mjs.\nimport SwiftUI\nenum TodoTheme {\n    static let darkCanvas = ${swiftColor(theme.colors.dark['neutral-1'])}\n    static let lightCanvas = ${swiftColor(theme.colors.light['neutral-1'])}\n    static let rowGap: CGFloat = ${Math.round(theme.spacing.s)}\n    static let listGap: CGFloat = ${Math.round(theme.spacing.m)}\n    static let textSize: CGFloat = ${Math.round(theme.text.m.size)}\n}\n`);
const folder = 'native/ios/Resources/Assets.xcassets/AppIcon.appiconset';
mkdirSync(folder, { recursive: true });
writeFileSync('native/ios/Resources/Assets.xcassets/Contents.json', JSON.stringify({ info: { author: 'xcode', version: 1 } }));
writeFileSync(folder + '/Contents.json', JSON.stringify({ images: [{ filename: 'AppIcon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }], info: { author: 'xcode', version: 1 } }, null, 2));
execFileSync('swift', ['scripts/make-icon.swift', folder + '/AppIcon.png'], { stdio: 'inherit' });
