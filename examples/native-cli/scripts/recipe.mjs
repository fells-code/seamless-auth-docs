import { existsSync, readFileSync } from 'node:fs'
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
  const clientFile = join(generated, 'notes-cli-client.json')
  const clientId = existsSync(clientFile)
    ? JSON.parse(readFileSync(clientFile, 'utf8')).clientId
    : undefined
  return {
    generated,
    clientFile,
    recipe,
    mailboxUrl: `http://127.0.0.1:${settings.MAILBOX_PORT}`,
    appName: settings.APP_NAME,
    // All the CLI gets: nothing secret, and no way to the auth API.
    cli: {
      OIDC_ISSUER: recipe.issuer,
      OIDC_CLIENT_ID: clientId,
      API_RESOURCE: recipe.resource,
      API_SCOPES: recipe.scopes.join(' '),
      // Only for this local CA. A deployed issuer has a certificate the OS already trusts.
      NODE_EXTRA_CA_CERTS: join(generated, 'ca.crt'),
    },
  }
}
