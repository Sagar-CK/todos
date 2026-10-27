# Testing

`npm ci && npm test && npm run build` works with no backend settings. Native checks are `npm run mac:build` and `npm run ios:prepare`, followed by an Xcode Simulator build.

The integration tests operate on the backend selected by `.env.local`. They create disposable users with `example.test` addresses, perform task writes, and remove those users and their rows in `finally` blocks. They do not send email or change existing users.

For hosted Supabase, authenticate the CLI on macOS or set `SUPABASE_ACCESS_TOKEN` in the test process. Alternatively provide `SUPABASE_SERVICE_ROLE_KEY` in the test process only (also supports custom hosts). Never put these credentials in any `VITE_` setting or commit them.

```sh
node tests/backend.integration.mjs
# Start npm run dev in another terminal; install agent-browser first.
node tests/sync.integration.mjs
```

The backend test verifies authenticated CRUD, cross-user isolation, anonymous access denial, Realtime changes, and deletion tombstones. The browser test uses an isolated agent-browser session and checks sign-in, sync in both directions, offline replay, and reload persistence.

Device checks still required: Apple provisioning, magic-link handoff on an actual iPhone, widget appearance/taps, background refresh, and keyboard interaction on each macOS keyboard layout. The global shortcut uses physical key code 50, the US backtick key.
