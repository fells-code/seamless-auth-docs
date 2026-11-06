import { createServer } from 'node:http'

import * as oidc from 'openid-client'

const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000
const EXPIRY_MARGIN_MS = 30 * 1000

const page = (text) =>
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Desk Notes</title><p>${text}</p></html>`

/**
 * The loopback listener of RFC 8252 section 7.3: a port the OS picks, on the loopback address only,
 * for one redirect. A request with the wrong `state` is answered and ignored rather than ending the
 * sign-in, since any local process or web page can reach this port.
 */
async function listenForRedirect(expectedState, signal) {
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
      return send(400, 'This response does not match a sign-in the app started.')
    }
    send(200, 'Back to Desk Notes. You can close this tab.')
    deliver(url.search)
  })

  signal.addEventListener('abort', () => fail(signal.reason), { once: true })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  return {
    redirectUri: `http://127.0.0.1:${server.address().port}/callback`,
    redirected,
    close: () => server.close(),
  }
}

function claimsOf(jwt) {
  // Shown to the user only. The backend is what verifies the token.
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString())
}

/**
 * The app's side of RFC 8252: a public client with no secret, the authorization code flow with
 * PKCE in the system browser, the refresh token in the OS credential store and the access token
 * in memory.
 */
export function createOidcSession({ issuer, clientId, resource, scopes, store, openBrowser }) {
  let configuration
  let access
  let idToken
  let refreshing
  let abortPendingSignIn

  const configure = async () => {
    configuration ??= await oidc.discovery(new URL(issuer), clientId, undefined, oidc.None())
    return configuration
  }

  const adopt = async (tokens) => {
    // Save first: a crash after this leaves the app holding the live refresh token, not a spent one.
    if (tokens.refresh_token) await store.set(tokens.refresh_token)
    access = {
      token: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in ?? 0) * 1000,
    }
    idToken = tokens.id_token ?? idToken
  }

  const forget = async () => {
    access = undefined
    idToken = undefined
    await store.delete()
  }

  /** Signs in, or steps up when `acrValues` or `maxAge` come from a backend's RFC 9470 challenge. */
  async function signIn({ acrValues, maxAge } = {}) {
    const config = await configure()
    abortPendingSignIn?.abort(new Error('Replaced by a newer sign-in'))
    const aborter = new AbortController()
    abortPendingSignIn = aborter
    const timer = setTimeout(
      () => aborter.abort(new Error('The sign-in timed out')),
      SIGN_IN_TIMEOUT_MS,
    )

    const state = oidc.randomState()
    const nonce = oidc.randomNonce()
    const verifier = oidc.randomPKCECodeVerifier()
    const listener = await listenForRedirect(state, aborter.signal)

    try {
      const parameters = {
        redirect_uri: listener.redirectUri,
        response_type: 'code',
        scope: ['openid', 'email', 'offline_access', ...scopes].join(' '),
        resource,
        // The provider issues a refresh token for offline_access only when the user is asked.
        prompt: 'consent',
        state,
        nonce,
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: 'S256',
        ...(acrValues ? { acr_values: acrValues } : {}),
        ...(maxAge !== undefined ? { max_age: String(maxAge) } : {}),
      }
      await openBrowser(oidc.buildAuthorizationUrl(config, parameters).href)

      const search = await listener.redirected
      const tokens = await oidc.authorizationCodeGrant(
        config,
        new URL(`${listener.redirectUri}${search}`),
        {
          pkceCodeVerifier: verifier,
          expectedState: state,
          expectedNonce: nonce,
          ...(maxAge !== undefined ? { maxAge } : {}),
        },
        { resource },
      )
      const superseded = await store.get()
      await adopt(tokens)
      // A step-up starts a new grant, so the one before it would otherwise stay usable.
      if (superseded) {
        await oidc
          .tokenRevocation(config, superseded, { token_type_hint: 'refresh_token' })
          .catch(() => {})
      }
    } finally {
      clearTimeout(timer)
      listener.close()
    }
  }

  /** One refresh at a time: refresh tokens rotate, and a token used twice revokes the grant. */
  function refresh() {
    refreshing ??= (async () => {
      const config = await configure()
      const current = await store.get()
      if (!current) throw new Error('Not signed in')
      try {
        await adopt(await oidc.refreshTokenGrant(config, current, { resource }))
      } catch (error) {
        if (error.error === 'invalid_grant') await forget()
        throw error
      }
    })().finally(() => {
      refreshing = undefined
    })
    return refreshing
  }

  async function accessToken() {
    if (!access || access.expiresAt - EXPIRY_MARGIN_MS <= Date.now()) await refresh()
    return access.token
  }

  /** Ends this app's grant. The Seamless session in the browser stays. */
  async function signOut() {
    const config = await configure()
    const current = await store.get()
    let revoked = false
    try {
      if (current) {
        await oidc.tokenRevocation(config, current, { token_type_hint: 'refresh_token' })
        revoked = true
      }
    } finally {
      await forget()
    }
    return { revoked }
  }

  /**
   * Also ends the Seamless session, which lives in the browser's cookies, so only the browser can
   * end it. The hosted page asks the user to confirm, then shows its own signed-out page. An app
   * that wants the browser back can pass a registered post_logout_redirect_uri here.
   */
  async function signOutEverywhere() {
    const config = await configure()
    const hint = idToken
    const result = await signOut()
    await openBrowser(
      oidc.buildEndSessionUrl(config, {
        client_id: clientId,
        ...(hint ? { id_token_hint: hint } : {}),
      }).href,
    )
    return result
  }

  async function status() {
    const signedIn = Boolean(await store.get())
    if (!access) return { signedIn }
    const { sub, acr, amr, auth_time: authTime, aud, scope } = claimsOf(access.token)
    return { signedIn, token: { sub, acr, amr, authTime, aud, scope } }
  }

  /** On launch: a stored refresh token signs the app back in with no browser. */
  async function restore() {
    if (await store.get()) await refresh()
  }

  return { signIn, refresh, accessToken, signOut, signOutEverywhere, status, restore }
}
