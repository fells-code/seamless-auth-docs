import { readFile } from 'node:fs/promises'

import * as oidc from 'openid-client'

const EXPIRY_MARGIN_MS = 30 * 1000

/**
 * Account notices through a client link (ADR 0002 N5). The backend proves itself with its own key
 * and names the public client the user signed in to. The key stays on this server, and the auth API
 * is reached directly: it is private, so a desktop app never could.
 */
export function createNoticeSender({ issuer, apiUrl, backendClientId, keyFile, nativeClientId }) {
  let configuration
  let cached

  async function configure() {
    if (configuration) return configuration
    const jwk = JSON.parse(await readFile(keyFile, 'utf8'))
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    configuration = await oidc.discovery(
      new URL(issuer),
      backendClientId,
      undefined,
      oidc.PrivateKeyJwt({ key, kid: jwk.kid }),
    )
    return configuration
  }

  async function token() {
    if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return cached.value
    const tokens = await oidc.clientCredentialsGrant(await configure(), {
      resource: `${issuer}/seamless`,
      scope: 'notices:send',
    })
    cached = {
      value: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in ?? 0) * 1000,
    }
    return cached.value
  }

  return async function sendNotice(userId, { subject, text }) {
    const response = await fetch(`${apiUrl}/applications/account-notices`, {
      method: 'POST',
      headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId, clientId: nativeClientId, subject, text }),
    })
    return { status: response.status, body: await response.json() }
  }
}
