#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
app="build/Todos.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources/web"
cp dist/native.html "$app/Contents/Resources/web/native.html"
# Swift's top-level application entry point must be named main.swift.
cp native/mac/Main.swift build/main.swift
swiftc -O build/main.swift native/mac/DoubleTap.swift native/Shared/SessionVault.swift native/Shared/AuthLink.swift native/Shared/BackendConfig.swift -framework AppKit -framework WebKit -framework Security -framework Carbon -o "$app/Contents/MacOS/Todos"
cp build/MacInfo.plist "$app/Contents/Info.plist"
codesign --force --sign "${TODOS_SIGNING_IDENTITY:--}" "$app"
printf 'Built %s\n' "$app"
