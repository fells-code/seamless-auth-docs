# Native desktop example

An Electron app and the small API behind it, on the Seamless Auth OpenID Provider. It is the
runnable half of the [native apps guide](https://docs.seamlessauth.com/build/native-apps-oidc), and
its end-to-end run doubles as a conformance check for the pattern in
[ADR 0002](https://github.com/fells-code/seamless-auth-api/blob/main/docs/adr/0002-native-and-desktop-apps.md).
Nothing in it is specific to one product. "Desk Notes" is a stand-in.

| Path                     | What it is                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `app/oidc-session.mjs`   | System browser, loopback listener, PKCE, code exchange, refresh, revocation, end session |
| `app/token-store.mjs`    | The refresh token in the OS credential store, with no file fallback                      |
| `app/backend-client.mjs` | Calls the backend, and follows an RFC 9470 challenge back through the browser            |
| `app/main.mjs`           | The Electron main process. Tokens stay here. The window only shows the app's own page    |
| `backend/server.mjs`     | Verify-only guards from `@seamless-auth/express`, one scope route, one step-up route     |
| `backend/notices.mjs`    | Client credentials with the backend's own key, and a notice through the client link      |
| `scripts/`               | Reads the local recipe's settings, and turns notices on for the backend client           |
| `e2e/run.mjs`            | The whole thing, driven by Playwright                                                    |

## Needs

- Node 22.12 or newer, and Docker with Compose for the local instance.
- The [local recipe](https://github.com/fells-code/seamless-auth-oidc-provider/pull/60) of
  `seamless-auth-oidc-provider`, at commit `16fe6e5`.
- Seamless Auth API v0.23.0 or later for the notice, since earlier versions have no client link
  routes. Sign-in, refresh, revocation and step-up do not depend on links.
- Edge image `v0.3.0` or later (the first with `acr`, `amr` and `auth_time` on access tokens), and
  `@seamless-auth/express` 0.24.0. The recipe pins API v0.23.0 and edge v0.4.1, and `package.json`
  pins the adapter.

## Run it

```bash
# In a checkout of seamless-auth-oidc-provider, at the commit above.
local/up.sh
export RECIPE=$PWD/local

# Here.
npm ci
node scripts/enable-notices.mjs "$RECIPE"
```

`enable-notices.mjs` is there because the recipe's seed registers the backend client and its link
but does not set `noticesEnabled`. Then, in two terminals:

```bash
eval "$(node scripts/recipe-env.mjs backend "$RECIPE")"
npm run backend
```

```bash
eval "$(node scripts/recipe-env.mjs app "$RECIPE")"
npm run app
```

The app opens your default browser for sign-in, so that browser must trust the recipe's local CA.
The recipe's README shows how, and that is your decision to make: nothing here does it for you. Read
the sign-in code at the recipe's mailbox, `http://127.0.0.1:9025` by default. The app's settings are
environment variables so the two sides stay visibly separate. A real app would compile them in, and
none of them is a secret.

## Run the check

```bash
npx playwright install chromium
RECIPE_DIR="$RECIPE" npm run e2e
```

On Linux with no desktop session, it needs a display and a Secret Service:

```bash
xvfb-run -a dbus-run-session -- bash e2e/with-keyring.sh node e2e/run.mjs
```

[CI](../../.github/workflows/native-desktop-example.yaml) runs that on pull requests that touch this
directory and every week.

| It runs for real                                                                | It stands in                                                                                              |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| The Electron app, with its main and renderer processes and its sandboxed window | The default browser: Chromium from Playwright, handed the URL that `shell.openExternal` would have opened |
| The OS keychain entry, read from outside the app                                | The passkey: a virtual authenticator in that Chromium                                                     |
| The backend, the adapter from npm, the edge and the API                         | The mail provider: the recipe's mailbox                                                                   |

It checks the authorization request (PKCE `S256`, no secret, loopback on an OS-picked port), that the
listener refuses a wrong `state` and is not reachable off loopback, that the refresh token is in the
keychain and in no file the app wrote, the RFC 9470 challenge and the retry, that a stale `auth_time`
challenges again, a notice that names the desktop app, that the backend refuses another client's
valid token, a new launch restoring from the keychain, sign-out with revocation, and signing out of
Seamless.

It does not check:

- The OS actually opening a browser, or a real passkey or security key.
- Windows Credential Manager, or a packaged and signed build of the app.
- A private-use scheme redirect. The example uses loopback.
- Refreshing from several processes at once. The app holds a single instance lock, and that is all.
- A released API. Until v0.23.0, it runs on the commit the recipe pins.

## Why Electron

Tauri would suit this pattern just as well, and it is smaller once built. Electron is here because it
is the cheaper one to keep running in CI:

- [Playwright drives Electron directly](https://playwright.dev/docs/api/class-electron), with the
  same tool that drives the hosted page and its virtual authenticator, and it can replace
  `shell.openExternal` from the test with no test code in the app.
- Tauri needs a Rust build and WebKitGTK on the Linux runner, and its
  [WebDriver support](https://tauri.app/develop/tests/webdriver/) needs a separate driver.
- The main process is Node, so the app and the backend share `openid-client`.

## Why it lives here

This repository holds the guide it belongs to, and no plan phase calls for a new repository. The
example is a directory with its own `package.json`, so nothing it installs reaches the docs site.
