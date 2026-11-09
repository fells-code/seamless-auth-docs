# Native CLI example

A small command line tool on the Seamless Auth OpenID Provider, with both sign-in flows. It is the
CLI half of the runnable examples for the
[native apps guide](https://docs.seamlessauth.com/build/native-apps-oidc), beside
[`examples/native-desktop`](../native-desktop), and its end-to-end run doubles as a conformance
check. Nothing in it is specific to one product. "Notes" is a stand-in.

| Path                   | What it is                                                                       |
| ---------------------- | -------------------------------------------------------------------------------- |
| `lib/oidc-session.mjs` | Loopback listener, PKCE, device grant, code exchange, refresh, revocation        |
| `lib/token-store.mjs`  | Tokens in the OS credential store, with no file fallback                         |
| `lib/refresh-lock.mjs` | One refresher across every process of the CLI                                    |
| `lib/open-browser.mjs` | The system browser, by way of the OS, with `BROWSER` as an override              |
| `bin/notes.mjs`        | The commands: `login`, `login --device`, `status`, `token`, `logout`             |
| `scripts/`             | Registers the CLI's client, and reads the local recipe's settings                |
| `e2e/run.mjs`          | The whole thing, running the real CLI as a child process and driving the browser |

## Why these rules

- **No client secret.** Anything shipped in a binary can be read out of it, so this is a public
  client and PKCE (`S256`) protects the code. Neither flow sends a secret.
- **The system browser, never a webview.** The CLI never sees the user's credentials, and a passkey
  works, because the hosted page runs on the relying party's own domain.
- **A loopback redirect on a port the OS picks,** on `127.0.0.1` only, for one redirect (RFC 8252).
- **The device grant when there is no browser** (RFC 8628): over SSH, or in a container. Nothing has
  to reach back to the machine. Device tokens never carry `acr`, so do not use it for an API that
  requires a phishing-resistant sign-in.
- **Tokens in the OS keychain,** with no fallback to a file. If there is no keychain, the command
  fails and says so.
- **The access token is in the keychain too,** which is where a CLI differs from a desktop app. A
  desktop app keeps it in memory, but each CLI command is a new process, and without it every
  command would spend a refresh.
- **A lock around refresh.** Refresh tokens rotate, and a token used twice revokes the grant. Two
  commands in a pipeline are enough to do that, so each refresh takes a lock and reads the keychain
  again inside it.
- **stdout is for results.** Prompts and errors go to stderr, so
  `curl -H "Authorization: Bearer $(notes token)"` works.

## Needs

- Node 22.12 or newer, and Docker with Compose for the local instance.
- The [local recipe](https://github.com/fells-code/seamless-auth-oidc-provider/tree/main/local) of
  `seamless-auth-oidc-provider`, at commit `c0fd8da`.
- The recipe runs the published Seamless Auth API v0.23.0 and edge v0.4.0 images.

## Run it

```bash
# In a checkout of seamless-auth-oidc-provider, at the commit above.
local/up.sh
export RECIPE=$PWD/local

# Here.
npm ci
node scripts/register-client.mjs "$RECIPE"
eval "$(node scripts/recipe-env.mjs "$RECIPE")"

node bin/notes.mjs login            # or: login --device
node bin/notes.mjs status
node bin/notes.mjs token
node bin/notes.mjs logout
```

`register-client.mjs` is there because the recipe's seed registers a desktop client with no device
grant. On your own instance, an admin registers the same record with the CLI:

```bash
seamless clients create "Notes CLI" --public --first-party --auth-method none \
  --redirect-uri http://127.0.0.1/callback \
  --grants authorization_code,refresh_token --device-flow
seamless clients resources <id> --set <api-identifier>=notes:read,notes:write
```

`login` opens your default browser, so that browser must trust the recipe's local CA. The recipe's
README shows how, and that is your decision to make: nothing here does it for you. `login --device`
has the same need, on whichever browser you approve from. Read the sign-in code at the recipe's
mailbox, `http://127.0.0.1:9025` by default. The settings are environment variables so the example
stays visibly generic. A real CLI would compile them in, and none of them is a secret.

## Run the check

```bash
npx playwright install chromium
RECIPE_DIR="$RECIPE" npm run e2e
```

On Linux with no desktop session, it needs a Secret Service:

```bash
dbus-run-session -- bash e2e/with-keyring.sh node e2e/run.mjs
```

[CI](../../.github/workflows/native-cli-example.yaml) runs that on pull requests that touch this
directory and every week.

Each run registers a new user, and the sign-in rate limits stay on in the recipe (15 minutes, per
address). A few runs in a row start failing on the hosted page with "Failed to register" or
"Verification failed". Wait, or restart the recipe's `api` service, which clears the counters.

| It runs for real                                               | It stands in                                                                                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| The CLI, as a new process for each command, with no test code  | The default browser: Chromium from Playwright, handed the URL through the `BROWSER` variable |
| The OS keychain entries, read from outside the CLI             | The passkey: a virtual authenticator in that Chromium                                        |
| The edge and the API                                           | The mail provider: the recipe's mailbox                                                      |
| The requests the CLI sends, recorded by a `node --import` hook | The second device for `--device`: the same Chromium, on the same machine                     |

It checks the authorization request (PKCE `S256`, no secret, loopback on an OS-picked port), that the
listener refuses a wrong `state`, is not reachable off loopback and closes afterwards, that no request
in either flow carries a secret, that the token verifies against the JWKS with `at+jwt`, `iss`, `aud`,
and the scopes, that the refresh token is in the keychain and not in the output or in the CLI's
working or state directories, that a new command reuses the stored token, refresh and rotation, six
commands at once spending one refresh, a stale lock being taken over, sign-out with revocation, the
device flow's code, polling interval, a wrong code and a denied approval, and that device tokens have
no `acr`, after a refresh too.

It does not check:

- The OS actually opening a browser, or a real passkey or security key. The per-OS commands in
  `lib/open-browser.mjs` have not been run by this check.
- Windows Credential Manager, or a packaged and signed build of the CLI.
- A locked keychain, or a machine with none.
- A device code that expires, or `slow_down`. The CLI waits the interval, so it does not earn one.
- That the CLI wrote no file anywhere on the disk. It looks in the working and state directories.
- A released API. Until v0.23.0, it runs on the commit the recipe pins.

## Why a standalone CLI, and not `seamless profile login`

The issue this answers asks for an example an adopter can copy, with nothing specific to one product.
`seamless profile login` is the Seamless CLI signing in to its own instance: after the provider
sign-in, it spends the token at `POST /sessions/exchange` for a first-party admin session and keeps
no provider token, which is not what an adopter's CLI does. An adopter's CLI keeps the provider's
tokens and calls its own API, which is what this one shows. The guide covers
[`seamless profile login`](https://docs.seamlessauth.com/build/native-apps-oidc#a-runnable-cli-example)
as well, and that CLI has its own end-to-end tests in its repository.

## Why it lives here

This repository holds the guide it belongs to, and no plan phase calls for a new repository. The
example is a directory with its own `package.json`, so nothing it installs reaches the docs site.
