import { createServer } from 'node:http'

import * as oidc from 'openid-client'

const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000
const EXPIRY_MARGIN_MS = 30 * 1000

const page = (text) =>
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Notes CLI</title><p>${text}</p></html>`

/**
 * The loopback listener of RFC 8252 section 7.3: a port the OS picks, on the loopback address only,
 * for one redirect. A request with the wrong `state` is answered and ignored rather than ending the
 * sign-in, since any local process or web page can reach this port.
 */
async function listenForRedirect(expectedState) {
  let deliver
  let fail
  const redirected = new Promise((resolve, reject) => {
    deliver = resolve
    fail = reject
  })

  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    const send = (status, text) => {
      res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', connection: 'close' })
      res.end(page(text))
    }
    if (url.pathname !== '/callback') return send(404, 'Not found.')
    if (url.searchParams.get('state') !== expectedState) {
      return send(400, 'This response does not match a sign-in this command started.')
    }
    send(200, 'Back to your terminal. You can close this tab.')
    deliver(url.search)
  })
  const timer = setTimeout(
    () => fail(new Error('The sign-in timed out. Run the command again.')),
    SIGN_IN_TIMEOUT_MS,
  )

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  return {
    redirectUri: `http://127.0.0.1:${server.address().port}/callback`,
    redirected,
    close: () => {
      clearTimeout(timer)
      server.close()
      server.closeAllConnections()
    },
  }
}

/**
 * The CLI's side of RFC 8252 and RFC 8628: a public client with no secret, either flow, and every
 * token in the OS credential store. Anything for the user to read goes to `say`, so stdout stays
 * clean for `notes token`.
 */
export function createOidcSession({
  issuer,
  clientId,
  resource,
  scopes,
  store,
  withLock,
  openBrowser,
  say,
}) {
  const scope = ['openid', 'offline_access', ...scopes].join(' ')
  let configuration

  const configure = async () => {
    configuration ??= await oidc.discovery(new URL(issuer), clientId, undefined, oidc.None())
    return configuration
  }

  const adopt = async (tokens) => {
    // Save first: a crash after this leaves the CLI holding the live refresh token, not a spent one.
    if (tokens.refresh_token) await store.setRefresh(tokens.refresh_token)
    const access = {
      token: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in ?? 0) * 1000,
    }
    await store.setAccess(access)
    return access
  }

  /** Replaces whatever grant this CLI held, which would otherwise stay usable. */
  const replaceGrant = async (config, tokens) =>
    withLock(async () => {
      const superseded = await store.getRefresh()
      await adopt(tokens)
      if (superseded) {
        await oidc
          .tokenRevocation(config, superseded, { token_type_hint: 'refresh_token' })
          .catch(() => {})
      }
    })

  /** Authorization code with PKCE, in the system browser, back to a loopback redirect. */
  async function signInWithBrowser() {
    const config = await configure()
    const state = oidc.randomState()
    const nonce = oidc.randomNonce()
    const verifier = oidc.randomPKCECodeVerifier()
    const listener = await listenForRedirect(state)

    try {
      const url = oidc.buildAuthorizationUrl(config, {
        redirect_uri: listener.redirectUri,
        response_type: 'code',
        scope,
        resource,
        // The provider issues a refresh token for offline_access only when the user is asked.
        prompt: 'consent',
        state,
        nonce,
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: 'S256',
      }).href
      say(`Opening your browser to sign in. If it does not open, go to:\n\n  ${url}\n`)
      say('On a machine with no browser, use --device instead.')
      openBrowser(url)

      const search = await listener.redirected
      const tokens = await oidc.authorizationCodeGrant(
        config,
        new URL(`${listener.redirectUri}${search}`),
        { pkceCodeVerifier: verifier, expectedState: state, expectedNonce: nonce },
        { resource },
      )
      await replaceGrant(config, tokens)
    } finally {
      listener.close()
    }
  }

  /** The device grant, for a machine with no browser. Nothing has to reach back to this machine. */
  async function signInWithDevice() {
    const config = await configure()
    const device = await oidc.initiateDeviceAuthorization(config, { scope, resource })
    say(`On any device with a browser, go to:\n\n  ${device.verification_uri}\n`)
    say(`and enter this code:\n\n  ${device.user_code}\n`)
    say('Only continue if you started this sign-in yourself. Waiting for approval...')
    const tokens = await oidc.pollDeviceAuthorizationGrant(config, device)
    await replaceGrant(config, tokens)
  }

  /**
   * An access token, refreshed if it is about to expire. The second read inside the lock is what
   * makes the lock work: the command that waited finds the token the first one just rotated.
   */
  async function accessToken() {
    const fresh = (access) => access && access.expiresAt - EXPIRY_MARGIN_MS > Date.now()
    const cached = await store.getAccess()
    if (fresh(cached)) return cached.token

    const config = await configure()
    return withLock(async () => {
      const current = await store.getAccess()
      if (fresh(current)) return current.token
      const refreshToken = await store.getRefresh()
      if (!refreshToken) throw new Error('Not signed in. Run: notes login')
      try {
        return (await adopt(await oidc.refreshTokenGrant(config, refreshToken, { resource }))).token
      } catch (error) {
        if (error.error === 'invalid_grant') await store.delete()
        throw error
      }
    })
  }

  /** Ends this CLI's grant. The user stays signed in to the browser and to their other apps. */
  async function signOut() {
    const config = await configure()
    return withLock(async () => {
      const current = await store.getRefresh()
      let revoked = false
      try {
        if (current) {
          await oidc.tokenRevocation(config, current, { token_type_hint: 'refresh_token' })
          revoked = true
        }
      } finally {
        await store.delete()
      }
      return { revoked }
    })
  }

  return { signInWithBrowser, signInWithDevice, accessToken, signOut }
}
