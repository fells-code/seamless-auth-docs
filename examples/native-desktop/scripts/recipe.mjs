import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** What the example needs from a running local recipe, whose `local/` directory is `recipeDir`. */
export function readRecipe(recipeDir) {
  const dir = resolve(recipeDir)
  const generated = join(dir, '.generated')
  const settings = Object.fromEntries(
    readFileSync(join(dir, 'settings.env'), 'utf8')
      .split('\n')
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  )
  const recipe = JSON.parse(readFileSync(join(generated, 'recipe.json'), 'utf8'))
  const shared = {
    SEAMLESS_ISSUER: recipe.issuer,
    NATIVE_CLIENT_ID: recipe.nativeClientId,
    API_RESOURCE: recipe.resource,
    // Only for this local CA. A deployed issuer has a certificate the OS already trusts.
    NODE_EXTRA_CA_CERTS: join(generated, 'ca.crt'),
  }
  return {
    generated,
    recipe,
    mailboxUrl: `http://127.0.0.1:${settings.MAILBOX_PORT}`,
    appName: settings.APP_NAME,
    // What the desktop app gets is deliberately short: nothing secret, and no way to the auth API.
    app: {
      ...shared,
      API_SCOPES: recipe.scopes.join(' '),
      BACKEND_URL: `http://127.0.0.1:${process.env.BACKEND_PORT ?? 8787}`,
    },
    backend: {
      ...shared,
      BACKEND_PORT: process.env.BACKEND_PORT ?? '8787',
      BACKEND_CLIENT_ID: recipe.backendClientId,
      BACKEND_KEY_FILE: join(generated, 'backend-key.json'),
      SEAMLESS_API_URL: recipe.apiUrl,
    },
  }
}
