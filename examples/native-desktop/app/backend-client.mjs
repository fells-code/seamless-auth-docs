/** Reads an RFC 6750 or RFC 9470 challenge, whose values may be quoted or bare tokens. */
export function parseChallenge(header) {
  if (!header?.toLowerCase().startsWith('bearer')) return {}
  const challenge = {}
  for (const [, name, quoted, bare] of header.matchAll(/([a-z_]+)=(?:"([^"]*)"|([^\s,]+))/gi)) {
    challenge[name] = quoted ?? bare
  }
  return challenge
}

/**
 * Calls the app's backend with the access token. An expired token refreshes once. An RFC 9470
 * challenge sends the user through the system browser with what the challenge asks for, once.
 */
export function createBackendClient({ baseUrl, session }) {
  const send = async (method, path) =>
    fetch(new URL(path, baseUrl), {
      method,
      headers: { authorization: `Bearer ${await session.accessToken()}` },
    })

  return async function call(method, path) {
    let response = await send(method, path)
    let stepUp

    if (response.status === 401) {
      const challenge = parseChallenge(response.headers.get('www-authenticate'))
      if (challenge.error === 'insufficient_user_authentication') {
        stepUp = { acrValues: challenge.acr_values, maxAge: challenge.max_age }
        await session.signIn({
          acrValues: challenge.acr_values,
          maxAge: challenge.max_age === undefined ? undefined : Number(challenge.max_age),
        })
        response = await send(method, path)
      } else if (challenge.error === 'invalid_token') {
        await session.refresh()
        response = await send(method, path)
      }
    }

    return { status: response.status, body: await response.json(), stepUp }
  }
}
