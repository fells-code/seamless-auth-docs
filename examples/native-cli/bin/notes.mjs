#!/usr/bin/env node
import { homedir } from 'node:os'
import { join } from 'node:path'

import { createOidcSession } from '../lib/oidc-session.mjs'
import { openBrowser } from '../lib/open-browser.mjs'
import { withRefreshLock } from '../lib/refresh-lock.mjs'
import { createTokenStore } from '../lib/token-store.mjs'

const USAGE = `Usage: notes <command>

  login            Sign in through your browser
  login --device   Sign in from another device, for a machine with no browser
  status           Show who is signed in
  token            Print an access token for the API, refreshing it if needed
  logout           Revoke this CLI's grant and delete its tokens`

const { OIDC_ISSUER, OIDC_CLIENT_ID, API_RESOURCE, API_SCOPES } = process.env
const say = (line) => console.error(line)

function claimsOf(jwt) {
  // Shown to the user only. The API the token is for is what verifies it.
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString())
}

async function run([command, ...args]) {
  if (!command || command === 'help' || command === '--help') {
    console.log(USAGE)
    return 0
  }
  if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !API_RESOURCE) {
    say(
      'Set OIDC_ISSUER, OIDC_CLIENT_ID and API_RESOURCE. A real CLI would compile them in. None is a secret.',
    )
    return 2
  }

  const lockDir = process.env.XDG_STATE_HOME ?? join(homedir(), '.local', 'state')
  const lockPath = join(lockDir, 'notes-cli', 'refresh.lock')
  const session = createOidcSession({
    issuer: OIDC_ISSUER,
    clientId: OIDC_CLIENT_ID,
    resource: API_RESOURCE,
    scopes: API_SCOPES?.split(' ').filter(Boolean) ?? [],
    store: createTokenStore({
      service: 'com.example.notes-cli',
      account: `${OIDC_ISSUER} ${OIDC_CLIENT_ID}`,
    }),
    withLock: (work) => withRefreshLock(lockPath, work),
    openBrowser,
    say,
  })

  switch (command) {
    case 'login': {
      await (args.includes('--device') ? session.signInWithDevice() : session.signInWithBrowser())
      const { sub } = claimsOf(await session.accessToken())
      say(`Signed in as ${sub}.`)
      return 0
    }
    case 'status': {
      const { sub, aud, scope, acr, amr, exp } = claimsOf(await session.accessToken())
      console.log(JSON.stringify({ sub, aud, scope, acr, amr, exp }, null, 2))
      return 0
    }
    case 'token':
      console.log(await session.accessToken())
      return 0
    case 'logout': {
      const { revoked } = await session.signOut()
      say(revoked ? 'Signed out, and the grant is revoked.' : 'Already signed out.')
      return 0
    }
    default:
      say(USAGE)
      return 2
  }
}

// What the provider answered, in words. openid-client's own message does not name it.
function describe(error) {
  switch (error.error) {
    case 'access_denied':
      return 'The sign-in was denied in the browser.'
    case 'expired_token':
      return 'The code expired before it was approved. Run the command again.'
    case 'invalid_grant':
      return 'That sign-in is no longer valid. Run: notes login'
    case undefined:
      return error.message
    default:
      return `The provider refused the request: ${error.error}`
  }
}

try {
  process.exitCode = await run(process.argv.slice(2))
} catch (error) {
  say(describe(error))
  process.exitCode = 1
}
