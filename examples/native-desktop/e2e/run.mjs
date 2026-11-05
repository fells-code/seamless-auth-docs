// Runs the example end to end against a local recipe: the real Electron app, its real keychain
// entry, the backend, and the hosted page in Chromium with a virtual authenticator. Chromium stands
// in for the user's default browser, so shell.openExternal is replaced here and only here, to hand
// the URL to it. Needs the recipe up and scripts/enable-notices.mjs already run.
//   RECIPE_DIR=/path/to/local node e2e/run.mjs
import { spawn, spawnSync } from 'node:child_process'
import { createHash, X509Certificate } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { networkInterfaces, tmpdir } from 'node:os'
import { join } from 'node:path'
import { connect } from 'node:tls'
import { fileURLToPath } from 'node:url'

import * as oidc from 'openid-client'
import { _electron, chromium } from 'playwright'

import { readRecipe } from '../scripts/recipe.mjs'

const STEP_UP_MAX_AGE = 30
const root = fileURLToPath(new URL('..', import.meta.url))
const shots = process.env.SCREENSHOT_DIR ?? join(root, 'e2e', 'screenshots')
mkdirSync(shots, { recursive: true })
process.env.BACKEND_PORT ??= '8797'

if (!process.env.RECIPE_DIR) {
  console.error('Set RECIPE_DIR to the recipe local directory.')
  process.exit(1)
}
const {
  recipe,
  app: appEnv,
  backend: backendEnv,
  mailboxUrl,
  appName,
} = readRecipe(process.env.RECIPE_DIR)
const caFile = appEnv.NODE_EXTRA_CA_CERTS
const issuerUrl = new URL(recipe.issuer)
const email = `desk+${Date.now()}@${appName}.localhost`
const electronBinary = createRequire(import.meta.url)('electron')
const service = 'com.example.desknotes'
const account = `${recipe.issuer} ${recipe.nativeClientId}`
const userData = mkdtempSync(join(tmpdir(), 'desknotes-e2e-'))

// The Node side of this script talks to the local CA and the issuer too.
if (process.env.NODE_EXTRA_CA_CERTS !== caFile) {
  const { status } = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, NODE_EXTRA_CA_CERTS: caFile },
  })
  process.exit(status ?? 1)
}

const failures = []
function check(label, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${!ok && detail ? `: ${detail}` : ''}`)
  if (!ok) failures.push(label)
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(what, read, timeout = 30_000) {
  const deadline = Date.now() + timeout
  for (;;) {
    const value = await read()
    if (value) return value
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`)
    await sleep(100)
  }
}

function keychain(operation) {
  const { stdout, status, stderr } = spawnSync(
    electronBinary,
    [join(root, 'e2e', 'keychain.mjs'), operation, service, account],
    { cwd: root, encoding: 'utf8', env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } },
  )
  if (status !== 0) throw new Error(`keychain ${operation}: ${stderr}`)
  return operation === 'read' ? JSON.parse(stdout).value : undefined
}

function filesContaining(dir, needle) {
  const hits = []
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    const path = join(entry.parentPath, entry.name)
    try {
      if (readFileSync(path).includes(needle)) hits.push(path)
    } catch {
      // Chromium holds some of its files locked.
    }
  }
  return hits
}

// Chromium takes no CA file. It accepts the served certificate by key hash, after that certificate
// is checked against the local CA here. WebAuthn refuses a page with a certificate error, so
// ignoring errors altogether would not do.
const servedKeyHash = () =>
  new Promise((resolve, reject) => {
    const socket = connect(
      {
        host: '127.0.0.1',
        port: Number(issuerUrl.port),
        servername: issuerUrl.hostname,
        ca: readFileSync(caFile),
      },
      () => {
        const der = new X509Certificate(socket.getPeerCertificate().raw).publicKey.export({
          type: 'spki',
          format: 'der',
        })
        socket.end()
        resolve(createHash('sha256').update(der).digest('base64'))
      },
    )
    socket.on('error', reject)
  })

const backend = spawn(process.execPath, [join(root, 'backend', 'server.mjs')], {
  env: { ...process.env, ...backendEnv, STEP_UP_MAX_AGE: String(STEP_UP_MAX_AGE) },
  stdio: ['ignore', 'inherit', 'inherit'],
})
const backendCall = (method, path, token) =>
  fetch(new URL(path, appEnv.BACKEND_URL), {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })

const browser = await chromium.launch({
  args: [`--ignore-certificate-errors-spki-list=${await servedKeyHash()}`],
})
const context = await browser.newContext()
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('WebAuthn.enable')
await cdp.send('WebAuthn.addVirtualAuthenticator', {
  options: {
    protocol: 'ctap2',
    transport: 'internal',
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
    automaticPresenceSimulation: true,
  },
})

let electronApp
let window

async function launchApp() {
  electronApp = await _electron.launch({
    executablePath: electronBinary,
    args: [root, `--user-data-dir=${userData}`],
    cwd: root,
    env: { ...process.env, ...appEnv },
  })
  // Before the app does anything over the network: the stand-in for the default browser, and a
  // record of what the main process sends and receives.
  await electronApp.evaluate(({ shell }) => {
    globalThis.opened = []
    shell.openExternal = async (url) => {
      globalThis.opened.push(url)
    }
    globalThis.traffic = []
    const realFetch = globalThis.fetch
    globalThis.fetch = async (input, init = {}) => {
      const request = new Request(input, init)
      const body = init.body ? String(init.body) : ''
      const response = await realFetch(input, init)
      globalThis.traffic.push({
        url: request.url,
        method: request.method,
        body,
        authorization: request.headers.get('authorization'),
        status: response.status,
        challenge: response.headers.get('www-authenticate'),
      })
      return response
    }
  })
  window = await electronApp.firstWindow()
  await window
    .locator('#who')
    .filter({ hasText: /Signed/ })
    .waitFor()
  await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide())
}

const opened = () => electronApp.evaluate(() => globalThis.opened)
const traffic = () => electronApp.evaluate(() => globalThis.traffic)
const clearOpened = () => electronApp.evaluate(() => void (globalThis.opened = []))

// The window is hidden so a test run does not take over the screen, and a hidden window paints
// nothing, so the buttons are clicked through the DOM and not with Playwright's actionability checks.
async function press(name) {
  await window.locator('#result').evaluate((node) => (node.textContent = ''))
  await window.getByRole('button', { name }).evaluate((button) => button.click())
}
const result = async () => {
  const text = await window.locator('#result').textContent()
  return text ? JSON.parse(text) : undefined
}
const finished = () => until('the app to finish', result, 60_000)
const whoIs = () => window.locator('#who').textContent()
const shownClaims = async () => JSON.parse((await window.locator('#claims').textContent()) || '{}')

async function nextCode(before) {
  return until(`a code in the mailbox for ${email}`, async () => {
    const all = await (await fetch(`${mailboxUrl}/codes/${encodeURIComponent(email)}`)).json()
    return all.length > before ? all.at(-1) : undefined
  })
}

const atLoopback = () => page.url().startsWith('http://127.0.0.1')

async function register() {
  await page
    .getByLabel(/email address/i)
    .first()
    .fill(email)
  await page.getByRole('button', { name: /^register$/i }).click()
  await page.waitForURL(/verify-email-otp/)
  const code = await nextCode(0)
  const inputs = page.locator('input')
  if ((await inputs.count()) >= 6) {
    for (let i = 0; i < 6; i += 1) await inputs.nth(i).fill(code[i])
  } else {
    await inputs.first().fill(code)
  }
  const verify = page.getByRole('button', { name: /verify|continue|submit/i })
  if (await verify.count()) {
    await verify
      .first()
      .click()
      .catch(() => {})
  }
  await page.waitForURL(/register-passkey/, { timeout: 20_000 })
  await page.screenshot({ path: join(shots, 'register-passkey.png') })
  await page
    .getByRole('button', { name: /register|add|create|continue/i })
    .first()
    .click()
  const modalContinue = page.getByRole('button', { name: /^continue$/i })
  await modalContinue
    .waitFor({ timeout: 5000 })
    .then(() => modalContinue.click())
    .catch(() => {})
  await page.waitForURL(/recovery-codes|127\.0\.0\.1/, { timeout: 20_000 })
  if (page.url().includes('recovery-codes')) {
    await page.getByLabel(/i have saved/i).check()
    await page.getByRole('button', { name: /^continue$/i }).click()
  }
}

async function signInWithPasskey() {
  const toSignIn = page.getByRole('button', { name: /already have an account/i })
  if (await toSignIn.count()) await toSignIn.click()
  await page.getByLabel(/email address \/ phone number/i).fill(email)
  await page.getByRole('button', { name: /^login$/i }).click()
}

// Presses what the hosted page offers (a passkey, then consent) until the browser is back on the
// loopback redirect.
async function finishInteraction(label) {
  const deadline = Date.now() + 45_000
  let shot = false
  while (Date.now() < deadline && !atLoopback()) {
    const offered = page
      .getByRole('button', { name: /passkey|^(allow|continue|accept|confirm|verify)/i })
      .first()
    if (await offered.isEnabled({ timeout: 300 }).catch(() => false)) {
      if (!shot) await page.screenshot({ path: join(shots, `${label}-interaction.png`) })
      shot = true
      await offered.click({ timeout: 2000 }).catch(() => {})
    }
    await sleep(250)
  }
  if (!atLoopback()) throw new Error(`${label}: the browser never reached the loopback redirect`)
}

async function driveBrowser(label, act) {
  const url = await until(`${label}: the app to open the browser`, async () =>
    (await opened()).at(-1),
  )
  await clearOpened()
  await page.goto(url)
  await act?.()
  await finishInteraction(label)
  return new URL(url)
}

let exitCode = 1
try {
  const publicConfig = await oidc.discovery(
    issuerUrl,
    recipe.nativeClientId,
    undefined,
    oidc.None(),
  )
  await until('the backend', () =>
    backendCall('GET', '/health').then(
      (r) => r.ok,
      () => false,
    ),
  )
  keychain('delete')

  console.log('\nThe backend, before any sign-in')
  const anonymous = await backendCall('GET', '/notes')
  check(
    'no token: 401 missing_token',
    anonymous.status === 401 && (await anonymous.json()).error === 'missing_token',
  )
  const garbage = await backendCall('GET', '/notes', 'not.a.token')
  check(
    'a bad token: 401 invalid_token',
    garbage.status === 401 && (await garbage.json()).error === 'invalid_token',
  )

  await launchApp()
  check('the app starts signed out', (await whoIs()) === 'Signed out')
  check('the keychain starts empty', keychain('read') === null)

  console.log('\nSign-in: the system browser, PKCE and a loopback redirect')
  await press(/^Sign in with your browser/)
  const firstUrl = new URL(await until('the browser', async () => (await opened()).at(-1)))
  const firstRedirect = new URL(firstUrl.searchParams.get('redirect_uri'))
  check('the authorization URL is on the issuer', firstUrl.origin === recipe.issuer)
  check(
    'PKCE with S256',
    firstUrl.searchParams.get('code_challenge_method') === 'S256' &&
      Boolean(firstUrl.searchParams.get('code_challenge')),
  )
  check('the request carries no secret', !firstUrl.searchParams.has('client_secret'))
  check(
    'the redirect is 127.0.0.1 on an OS-picked port',
    firstRedirect.hostname === '127.0.0.1' && Number(firstRedirect.port) >= 1024,
    firstRedirect.href,
  )
  check(
    'the token is requested for the API',
    firstUrl.searchParams.get('resource') === recipe.resource,
  )

  const appSource = readdirSync(join(root, 'app'))
    .map((file) => readFileSync(join(root, 'app', file), 'utf8'))
    .join('\n')
  check(
    'the app source has no secret, backend key or auth API setting',
    !/client_secret|BACKEND_KEY|BACKEND_CLIENT|SEAMLESS_API_URL|<webview/.test(appSource),
  )

  const windows = await electronApp.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().map((w) => w.webContents.getURL()),
  )
  check(
    'the app never loads the sign-in page itself',
    windows.length === 1 && windows[0].startsWith('file:'),
    windows.join(),
  )
  const hasWebview = await window.locator('webview, iframe').count()
  check('the app has no webview or frame', hasWebview === 0)

  const forged = await fetch(`${firstRedirect.href}?code=forged&state=forged`)
  check('the listener refuses a redirect with the wrong state', forged.status === 400)
  const other = await fetch(`${firstRedirect.origin}/other`)
  check('the listener answers only its path', other.status === 404)
  const lan = Object.values(networkInterfaces())
    .flat()
    .find((address) => address.family === 'IPv4' && !address.internal)
  if (lan) {
    const reached = await fetch(`http://${lan.address}:${firstRedirect.port}/callback`).then(
      () => true,
      () => false,
    )
    check('the listener is not reachable off loopback', !reached)
  }

  await driveBrowser('register', async () => {
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 15_000 })
    await page.getByRole('heading', { level: 2 }).waitFor({ timeout: 10_000 })
    check('the hosted page is at the issuer', page.url().startsWith(recipe.issuer))
    await page.screenshot({ path: join(shots, 'hosted-page.png') })
    await register()
  })
  const signedIn = await finished()
  check('the sign-in finished in the app', signedIn.ok, JSON.stringify(signedIn))
  check('the app shows signed in', (await whoIs()) === 'Signed in')
  await page.screenshot({ path: join(shots, 'back-at-app.png') })

  const tokenRequest = (await traffic()).find((call) => call.body.includes('authorization_code'))
  const tokenParams = new URLSearchParams(tokenRequest.body)
  check(
    'the code exchange sends the verifier and client_id, and no secret',
    tokenParams.has('code_verifier') &&
      tokenParams.get('client_id') === recipe.nativeClientId &&
      !tokenParams.has('client_secret') &&
      !tokenRequest.authorization,
  )
  const refreshAfterSignIn = keychain('read')
  check('the refresh token is in the OS keychain', Boolean(refreshAfterSignIn))
  check(
    'the refresh token is in no file the app wrote',
    filesContaining(userData, refreshAfterSignIn).length === 0,
    filesContaining(userData, refreshAfterSignIn).join(),
  )
  const firstClaims = await shownClaims()
  check('the token is for the API', firstClaims.aud === recipe.resource, firstClaims.aud)
  check('registering used an email code, so no acr', firstClaims.acr === undefined, firstClaims.acr)
  console.log(`  claims: ${JSON.stringify(firstClaims)}`)
  const lastBearer = async () =>
    (await traffic())
      .filter((call) => call.authorization)
      .at(-1)
      ?.authorization.slice(7)

  console.log('\nA route that needs only a scope')
  await press(/^List notes/)
  const listed = await finished()
  check('GET /notes answers 200', listed.result?.status === 200, JSON.stringify(listed))
  check('with no step-up', listed.result?.stepUp === undefined)

  console.log('\nA route that needs a recent passkey')
  const beforeStepUp = await lastBearer()
  const refused = await backendCall('POST', '/notes/export', beforeStepUp)
  const refusedBody = await refused.json()
  const challengeHeader = refused.headers.get('www-authenticate')
  console.log(`  challenge: ${challengeHeader}`)
  check(
    '401 insufficient_user_authentication',
    refused.status === 401 && refusedBody.error === 'insufficient_user_authentication',
  )
  check(
    'the challenge names phr and max_age',
    /error="insufficient_user_authentication"/.test(challengeHeader) &&
      /acr_values="phr"/.test(challengeHeader) &&
      new RegExp(`max_age="?${STEP_UP_MAX_AGE}`).test(challengeHeader),
  )

  await clearOpened()
  await press(/^Export notes/)
  const stepUrl = await driveBrowser('step-up')
  check('the app asked for acr_values=phr', stepUrl.searchParams.get('acr_values') === 'phr')
  check(
    'the app asked for max_age',
    stepUrl.searchParams.get('max_age') === String(STEP_UP_MAX_AGE),
  )
  const exported = await finished()
  check(
    'the retried POST /notes/export answers 200',
    exported.result?.status === 200,
    JSON.stringify(exported),
  )
  const stepped = exported.result?.body?.signedInWith ?? {}
  console.log(`  signed in with: ${JSON.stringify(stepped)}`)
  check('the token states phr or phrh', ['phr', 'phrh'].includes(stepped.acr), stepped.acr)
  check('the token states a passkey in amr', /swk|hwk/.test(stepped.amr?.join() ?? ''), stepped.amr)

  const refreshAfterStepUp = keychain('read')
  check('the step-up replaced the stored refresh token', refreshAfterStepUp !== refreshAfterSignIn)
  const superseded = await oidc
    .refreshTokenGrant(publicConfig, refreshAfterSignIn, { resource: recipe.resource })
    .then(
      () => null,
      (error) => error.error,
    )
  check('the app revoked the refresh token it replaced', superseded === 'invalid_grant', superseded)

  console.log('\nA notice through the client link')
  await press(/^Email me a notice/)
  const notice = await finished()
  check('the backend sent the notice', notice.result?.status === 200, JSON.stringify(notice))
  console.log(`  answer: ${JSON.stringify(notice.result?.body)}`)
  const mail = await until('the notice in the mailbox', async () => {
    const text = await (await fetch(`${mailboxUrl}/`)).text()
    return text.split('\n').find((line) => line.includes(email) && line.includes('Sent by'))
  })
  check(
    'the email names the desktop app, not the backend',
    mail.includes(`Sent by ${appName} desktop app`),
    mail,
  )
  const direct = await fetch(`${recipe.apiUrl}/applications/account-notices`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await lastBearer()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ userId: firstClaims.sub, subject: 'x', text: 'x' }),
  })
  check('a user token cannot send a notice', direct.status === 401, String(direct.status))

  console.log('\nWho the backend serves, and what a public client cannot do')
  const jwk = JSON.parse(readFileSync(backendEnv.BACKEND_KEY_FILE, 'utf8'))
  const backendConfig = await oidc.discovery(
    issuerUrl,
    recipe.backendClientId,
    undefined,
    oidc.PrivateKeyJwt({
      key: await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
      kid: jwk.kid,
    }),
  )
  const machine = await oidc.clientCredentialsGrant(backendConfig, {
    resource: recipe.resource,
    scope: 'notes:read',
  })
  const machineAnswer = await backendCall('GET', '/notes', machine.access_token)
  check(
    "another client's valid token for this resource: 403 client_not_allowed",
    machineAnswer.status === 403 && (await machineAnswer.json()).error === 'client_not_allowed',
    String(machineAnswer.status),
  )
  const publicMachine = await oidc
    .clientCredentialsGrant(publicConfig, { resource: recipe.resource })
    .then(
      () => null,
      (error) => error.error,
    )
  check('the public client cannot use client_credentials', Boolean(publicMachine), publicMachine)

  console.log('\nRefresh')
  const beforeRefresh = keychain('read')
  await press(/^Refresh tokens/)
  const refreshed = await finished()
  check('the refresh succeeded', refreshed.ok, JSON.stringify(refreshed))
  check('the refresh token rotated in the keychain', keychain('read') !== beforeRefresh)
  const afterRefresh = await shownClaims()
  check('acr survives a refresh', afterRefresh.acr === stepped.acr, afterRefresh.acr)
  check('auth_time survives a refresh', afterRefresh.authTime === stepped.authTime)

  console.log(`\nFreshness: ${STEP_UP_MAX_AGE} seconds later the same route challenges again`)
  await sleep(Math.max(0, (afterRefresh.authTime + STEP_UP_MAX_AGE + 2) * 1000 - Date.now()))
  const stale = await backendCall('POST', '/notes/export', await lastBearer())
  check('401 once auth_time is older than max_age', stale.status === 401, String(stale.status))
  await clearOpened()
  await press(/^Export notes/)
  await driveBrowser('step-up-again')
  const exportedAgain = await finished()
  check(
    'a new passkey sign-in satisfies it',
    exportedAgain.result?.status === 200,
    JSON.stringify(exportedAgain),
  )
  check(
    'with a newer auth_time',
    exportedAgain.result?.body?.signedInWith?.authTime > stepped.authTime,
  )

  console.log('\nA new launch of the app')
  const beforeRelaunch = keychain('read')
  await electronApp.close()
  await launchApp()
  await until('the session restored', async () => (await keychain('read')) !== beforeRelaunch)
  await press(/^List notes/)
  const relisted = await finished()
  check(
    'the keychain signs the app back in',
    relisted.result?.status === 200,
    JSON.stringify(relisted),
  )
  check('with no browser', (await opened()).length === 0)

  console.log('\nSign out with revocation')
  const lastRefresh = keychain('read')
  const lastAccess = await lastBearer()
  await press(/^Sign out$/)
  const signedOut = await finished()
  check(
    'the app reports the token revoked',
    signedOut.result?.revoked === true,
    JSON.stringify(signedOut),
  )
  check('the keychain entry is gone', keychain('read') === null)
  check('the app shows signed out', (await whoIs()) === 'Signed out')
  check(
    'the revocation went to the revocation endpoint',
    (await traffic()).some((call) => call.url.endsWith('/token/revocation') && call.status === 200),
  )
  const replay = await oidc
    .refreshTokenGrant(publicConfig, lastRefresh, { resource: recipe.resource })
    .then(
      () => null,
      (error) => error.error,
    )
  check('the revoked refresh token is refused', replay === 'invalid_grant', replay)
  const afterRevoke = await backendCall('GET', '/notes', lastAccess)
  console.log(
    `  the access token issued before sign-out answers ${afterRevoke.status} at the backend until it expires`,
  )
  check('a verify-only backend does not see revocation', afterRevoke.status === 200)

  console.log('\nThe Seamless session outlives an app sign-out')
  await clearOpened()
  await press(/^Sign in with your browser/)
  const secondUrl = await driveBrowser('second-sign-in')
  await finished()
  check('signed in again with no new sign-in ceremony', (await whoIs()) === 'Signed in')
  check(
    'on another port',
    new URL(secondUrl.searchParams.get('redirect_uri')).port !== firstRedirect.port,
  )

  console.log('\nSign out of Seamless too')
  await clearOpened()
  await press(/^Sign out of Seamless too/)
  await finished()
  const endUrl = new URL(await until('the end session URL', async () => (await opened()).at(-1)))
  check(
    'the app opens the end session URL in the browser',
    endUrl.pathname.endsWith('/session/end'),
  )
  check('with an id_token_hint', endUrl.searchParams.has('id_token_hint'))
  await page.goto(endUrl.href)
  await page.screenshot({ path: join(shots, 'end-session.png') })
  await page
    .getByRole('button', { name: /yes|sign out|log ?out|confirm/i })
    .first()
    .click()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: join(shots, 'ended.png') })

  console.log('\nA passkey sign-in from nothing satisfies the route with no challenge')
  await clearOpened()
  await press(/^Sign in with your browser/)
  await driveBrowser('passkey', async () => {
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 15_000 })
    await page.getByRole('heading', { level: 2 }).waitFor({ timeout: 10_000 })
    await signInWithPasskey()
  })
  await finished()
  const passkeyClaims = await shownClaims()
  check('same account', passkeyClaims.sub === firstClaims.sub)
  check('acr is phr or phrh', ['phr', 'phrh'].includes(passkeyClaims.acr), passkeyClaims.acr)
  console.log(`  claims: ${JSON.stringify(passkeyClaims)}`)
  await clearOpened()
  await press(/^Export notes/)
  const noChallenge = await finished()
  check(
    'POST /notes/export answers 200',
    noChallenge.result?.status === 200,
    JSON.stringify(noChallenge),
  )
  check('the app did not need the browser', (await opened()).length === 0)

  console.log('\nA post-logout redirect to loopback, on any port of the registered URI')
  await clearOpened()
  await press(/^Sign out of Seamless too/)
  await finished()
  const lastEndUrl = new URL(
    await until('the end session URL', async () => (await opened()).at(-1)),
  )
  const signedOutListener = createServer((_req, res) => res.end('Signed out'))
  await new Promise((resolve) => signedOutListener.listen(0, '127.0.0.1', resolve))
  const { port: signedOutPort } = signedOutListener.address()
  const logoutTo = (path) => {
    const url = new URL(lastEndUrl)
    url.searchParams.set('post_logout_redirect_uri', `http://127.0.0.1:${signedOutPort}${path}`)
    return url.href
  }
  const wrongPath = await page.goto(logoutTo('/other'))
  check('another path is refused', wrongPath.status() >= 400, String(wrongPath.status()))
  await page.goto(logoutTo('/signed-out'))
  await page
    .getByRole('button', { name: /yes|sign out|log ?out|confirm/i })
    .first()
    .click()
  await page.waitForURL(/127\.0\.0\.1/, { timeout: 15_000 })
  check(
    'the registered path is accepted on a port it did not name',
    page.url().startsWith(`http://127.0.0.1:${signedOutPort}/signed-out`),
    page.url(),
  )
  signedOutListener.close()

  exitCode = failures.length ? 1 : 0
  console.log(failures.length ? `\n${failures.length} failed` : '\nAll checks passed')
} catch (error) {
  console.log(`\nStopped: ${error.message.split('\n')[0]}`)
  console.log(`  browser at ${page.url()}`)
  await page.screenshot({ path: join(shots, 'failure.png') }).catch(() => {})
  console.log(
    await page
      .locator('body')
      .ariaSnapshot()
      .catch(() => ''),
  )
  if (window) {
    console.log(
      `  app result: ${await window
        .locator('#result')
        .textContent()
        .catch(() => '')}`,
    )
  }
} finally {
  await electronApp?.close().catch(() => {})
  await browser.close()
  backend.kill()
  keychain('delete')
  rmSync(userData, { recursive: true, force: true })
}
process.exit(exitCode)
