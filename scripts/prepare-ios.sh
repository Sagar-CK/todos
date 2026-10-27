#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
node scripts/native-assets.mjs
mkdir -p native/ios/Resources/web
cp dist/native.html native/ios/Resources/web/native.html
if ! command -v xcodegen >/dev/null; then
  printf 'Install the project generator with: brew install xcodegen\n' >&2
  exit 1
fi
xcodegen generate --spec native/ios/project.generated.yml
printf 'Open native/ios/Todos.xcodeproj in Xcode and select your signing team for both targets.\n'
