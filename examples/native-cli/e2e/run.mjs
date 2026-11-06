// Runs the example end to end against a local recipe: the real CLI as a child process, its real
// keychain entries, and the hosted page in Chromium with a virtual authenticator. Chromium stands in
// for the user's default browser, through the BROWSER variable the CLI honours, so the CLI has no
// test code in it. Needs the recipe up and scripts/register-client.mjs already run.
//   RECIPE_DIR=/path/to/local node e2e/run.mjs
import { spawn, spawnSync } from 'node:child_process'
import { createHash, X509Certificate } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { networkInterfaces, tmpdir } from 'node:os'
import { join } from 'node:path'
import { connect } from 'node:tls'
import { fileURLToPath } from 'node:url'

import { createRemoteJWKSet, jwtVerify } from 'jose'
import * as oidc from 'openid-client'
import { chromium } from 'playwright'

import { readRecipe } from '../scripts/recipe.mjs'

const CONCURRENT_COMMANDS = 6
const root = fileURLToPath(new URL('..', import.meta.url))
const shots = process.env.SCREENSHOT_DIR ?? join(root, 'e2e', 'screenshots')
mkdirSync(shots, { recursive: true })

if (!process.env.RECIPE_DIR) {
  console.error('Set RECIPE_DIR to the recipe local directory.')
  process.exit(1)
}
const { recipe, cli: cliEnv, mailboxUrl, appName } = readRecipe(process.env.RECIPE_DIR)
if (!cliEnv.OIDC_CLIENT_ID) {
  console.error('Run scripts/register-client.mjs first.')
  process.exit(1)
}
const caFile = cliEnv.NODE_EXTRA_CA_CERTS
const clientId = cliEnv.OIDC_CLIENT_ID
const issuerUrl = new URL(recipe.issuer)
const email = `cli+${Date.now()}@${appName}.localhost`
const service = 'com.example.notes-cli'
const account = `${recipe.issuer} ${clientId}`

// The Node side of this script talks to the local CA and the issuer too.
if (process.env.NODE_EXTRA_CA_CERTS !== caFile) {
  const { status } = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, NODE_EXTRA_CA_CERTS: caFile },
  })
  process.exit(status ?? 1)
}

const work = mkdtempSync(join(tmpdir(), 'notes-cli-e2e-'))
const stateDir = join(work, 'state')
const cwd = join(work, 'cwd')
mkdirSync(cwd)
const lockFile = join(stateDir, 'notes-cli', 'refresh.lock')
const trafficFile = join(work, 'traffic.jsonl')
const openedFile = join(work, 'opened.txt')
const opener = join(work, 'browser')
writeFileSync(opener, '#!/bin/sh\nprintf \'%s\\n\' "$1" >> "$E2E_OPENED_FILE"\n')
chmodSync(opener, 0o755)

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

const readLines = (file) =>
  existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []
const traffic = () => readLines(trafficFile).map((line) => JSON.parse(line))
const opened = () => readLines(openedFile)
const clearRecords = () => {
  rmSync(trafficFile, { force: true })
  rmSync(openedFile, { force: true })
}

/** The CLI as a user runs it. `done` settles with its exit code and everything it printed. */
function notes(...args) {
  const child = spawn(
    process.execPath,
    ['--import', join(root, 'e2e', 'record-fetch.mjs'), join(root, 'bin', 'notes.mjs'), ...args],
    {
      cwd,
      env: {
        ...process.env,
        ...cliEnv,
        BROWSER: opener,
        XDG_STATE_HOME: stateDir,
        E2E_TRAFFIC_FILE: trafficFile,
        E2E_OPENED_FILE: openedFile,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const output = { stdout: '', stderr: '' }
  child.stdout.on('data', (chunk) => (output.stdout += chunk))
  child.stderr.on('data', (chunk) => (output.stderr += chunk))
  const done = new Promise((resolve) => {
    child.on('close', (code) => resolve({ code, ...output }))
  })
  return { child, output, done }
}
const run = (...args) => notes(...args).done

function keychain(operation) {
  const { stdout, status, stderr } = spawnSync(
    process.execPath,
    [join(root, 'e2e', 'keychain.mjs'), operation, service, account],
    { cwd: root, encoding: 'utf8' },
  )
  if (status !== 0) throw new Error(`keychain ${operation}: ${stderr}`)
  return operation === 'read' ? JSON.parse(stdout) : undefined
}

function filesContaining(dir, needle) {
  const hits = []
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    const path = join(entry.parentPath, entry.name)
    if (readFileSync(path).includes(needle)) hits.push(path)
  }
  return hits
}
const filesTheCliCouldWrite = (needle) => [
  ...filesContaining(cwd, needle),
  ...(existsSync(stateDir) ? filesContaining(stateDir, needle) : []),
]

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
  // The page submits by itself on the last digit, and a second submit of a spent code fails it.
  const moved = await page
    .waitForURL(/register-passkey/, { timeout: 3000 })
    .then(() => true)
    .catch(() => false)
  if (!moved)
    await page
      .getByRole('button', { name: /verify|continue|submit/i })
      .first()
      .click()
  await page.waitForURL(/register-passkey/, { timeout: 20_000 })
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

// Presses what the hosted page offers (a passkey, then consent) until `finished` says it is done.
async function finishInteraction(label, finished) {
  const deadline = Date.now() + 45_000
  let shot = false
  while (Date.now() < deadline && !(await finished())) {
    const offered = page
      .getByRole('button', { name: /passkey|^(allow|continue|accept|confirm|verify|yes)/i })
      .first()
    if (await offered.isEnabled({ timeout: 300 }).catch(() => false)) {
      if (!shot) await page.screenshot({ path: join(shots, `${label}-interaction.png`) })
      shot = true
      await offered.click({ timeout: 2000 }).catch(() => {})
    }
    await sleep(250)
  }
  if (!(await finished())) throw new Error(`${label}: the hosted page never finished`)
}

const openedUrl = () => until('the CLI to open the browser', () => opened().at(-1))

let exitCode = 1
try {
  const publicConfig = await oidc.discovery(issuerUrl, clientId, undefined, oidc.None())
  const jwks = createRemoteJWKSet(new URL(publicConfig.serverMetadata().jwks_uri))
  const verifyToken = async (token) =>
    (
      await jwtVerify(token, jwks, {
        issuer: recipe.issuer,
        audience: recipe.resource,
        typ: 'at+jwt',
      })
    ).payload
  const refreshGrants = () =>
    traffic().filter((call) => call.body.includes('grant_type=refresh_token'))
  keychain('delete')

  console.log('\nBefore any sign-in')
  const anonymous = await run('token')
  check('`token` exits 1', anonymous.code === 1, JSON.stringify(anonymous))
  check('and says to sign in', /notes login/.test(anonymous.stderr), anonymous.stderr)
  check('and prints nothing to stdout', anonymous.stdout === '')
  const empty = keychain('read')
  check('the keychain starts empty', empty.refresh === null && empty.access === null)

  const source = readdirSync(join(root, 'lib'))
    .map((file) => readFileSync(join(root, 'lib', file), 'utf8'))
    .concat(readFileSync(join(root, 'bin', 'notes.mjs'), 'utf8'))
    .join('\n')
  check(
    'the source has no secret, no embedded browser and no file storage for tokens',
    !/client_secret|BrowserWindow|webview|writeFile/.test(source),
  )

  console.log('\nLoopback: the system browser, PKCE and a redirect back to this machine')
  clearRecords()
  const login = notes('login')
  const firstUrl = new URL(await openedUrl())
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
  check(
    'the URL is also printed, for when no browser opens',
    login.output.stderr.includes(firstUrl.href),
  )
  check('stdout stays empty during sign-in', login.output.stdout === '')

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

  await page.goto(firstUrl.href)
  await page.waitForURL((url) => url.pathname === '/login', { timeout: 15_000 })
  await page.getByRole('heading', { level: 2 }).waitFor({ timeout: 10_000 })
  check('the hosted page is at the issuer', page.url().startsWith(recipe.issuer))
  await page.screenshot({ path: join(shots, 'hosted-page.png') })
  await register()
  await finishInteraction('register', async () => atLoopback())
  await page.screenshot({ path: join(shots, 'back-at-cli.png') })

  const loggedIn = await login.done
  check('`login` exits 0', loggedIn.code === 0, JSON.stringify(loggedIn))
  check(
    'the listener is closed afterwards',
    await fetch(firstRedirect.href).then(
      () => false,
      () => true,
    ),
  )

  const codeExchange = traffic().find((call) => call.body.includes('authorization_code'))
  const exchangeParams = new URLSearchParams(codeExchange.body)
  check(
    'the code exchange sends the verifier and client_id, and no secret',
    exchangeParams.has('code_verifier') &&
      exchangeParams.get('client_id') === clientId &&
      !exchangeParams.has('client_secret') &&
      !codeExchange.authorization,
  )

  const signedIn = keychain('read')
  check('the refresh token is in the OS keychain', Boolean(signedIn.refresh))
  check('the access token is in the OS keychain', Boolean(signedIn.access))
  const leaked = filesTheCliCouldWrite(signedIn.refresh)
  check('the refresh token is in no file the CLI wrote', leaked.length === 0, leaked.join())
  check(
    'and was not printed',
    !loggedIn.stderr.includes(signedIn.refresh) && !loggedIn.stdout.includes(signedIn.refresh),
  )
  check('the state directory holds nothing after sign-in', !existsSync(lockFile))

  console.log('\nThe access token')
  const printed = await run('token')
  const accessToken = printed.stdout.trim()
  check('`token` prints only the token', accessToken.split('.').length === 3, printed.stdout)
  const claims = await verifyToken(accessToken)
  console.log(`  claims: ${JSON.stringify(claims)}`)
  check('it verifies against the JWKS, with typ at+jwt, iss and aud', true)
  check('it names this client', claims.client_id === clientId, claims.client_id)
  check(
    'it has the scopes asked for',
    recipe.scopes.every((scope) => claims.scope?.split(' ').includes(scope)),
    claims.scope,
  )
  check('registering used an email code, so no acr', claims.acr === undefined, claims.acr)
  const status = await run('status')
  check('`status` shows the same subject', JSON.parse(status.stdout).sub === claims.sub)

  console.log('\nA new command reuses the stored token, with no browser and no refresh')
  clearRecords()
  check('the same access token', (await run('token')).stdout.trim() === accessToken)
  check('no refresh', refreshGrants().length === 0)
  check('no browser', opened().length === 0)

  console.log('\nRefresh')
  keychain('forget-access')
  clearRecords()
  const refreshed = await run('token')
  check('with the access token gone, `token` still answers', refreshed.code === 0)
  check('one refresh', refreshGrants().length === 1)
  check(
    'with no secret',
    !refreshGrants()[0].body.includes('client_secret') && !refreshGrants()[0].authorization,
  )
  check('for the API', (await verifyToken(refreshed.stdout.trim())).aud === recipe.resource)
  const afterRefresh = keychain('read')
  check('the refresh token rotated in the keychain', afterRefresh.refresh !== signedIn.refresh)

  console.log(`\n${CONCURRENT_COMMANDS} commands at once, with nothing fresh to reuse`)
  keychain('forget-access')
  clearRecords()
  const together = await Promise.all(
    Array.from({ length: CONCURRENT_COMMANDS }, () => run('token')),
  )
  check(
    'all of them succeed',
    together.every((result) => result.code === 0),
    JSON.stringify(together.map((result) => result.stderr)),
  )
  check(
    'with one token between them',
    new Set(together.map((result) => result.stdout.trim())).size === 1,
  )
  check('from one refresh', refreshGrants().length === 1, String(refreshGrants().length))
  check('the lock is released', !existsSync(lockFile))
  keychain('forget-access')
  check('the grant is still alive', (await run('token')).code === 0)

  console.log('\nA lock left behind by a killed command')
  mkdirSync(join(stateDir, 'notes-cli'), { recursive: true })
  writeFileSync(lockFile, '')
  const longAgo = new Date(Date.now() - 120_000)
  utimesSync(lockFile, longAgo, longAgo)
  keychain('forget-access')
  const afterStale = await run('token')
  check('the next command takes it over', afterStale.code === 0, afterStale.stderr)

  console.log('\nSign out with revocation')
  const lastRefresh = keychain('read').refresh
  clearRecords()
  const signedOut = await run('logout')
  check('`logout` exits 0 and says it revoked', /revoked/.test(signedOut.stderr), signedOut.stderr)
  check(
    'through the revocation endpoint',
    traffic().some((call) => call.url.endsWith('/token/revocation') && call.status === 200),
  )
  const cleared = keychain('read')
  check('the keychain is empty', cleared.refresh === null && cleared.access === null)
  const replay = await oidc
    .refreshTokenGrant(publicConfig, lastRefresh, { resource: recipe.resource })
    .then(
      () => null,
      (error) => error.error,
    )
  check('the revoked refresh token is refused', replay === 'invalid_grant', replay)
  check('`token` says to sign in again', (await run('token')).code === 1)

  console.log('\nThe browser session outlives a CLI sign-out')
  clearRecords()
  const secondLogin = notes('login')
  const secondUrl = new URL(await openedUrl())
  await page.goto(secondUrl.href)
  await finishInteraction('second-sign-in', async () => atLoopback())
  check('`login` exits 0', (await secondLogin.done).code === 0)
  check(
    'on another port',
    new URL(secondUrl.searchParams.get('redirect_uri')).port !== firstRedirect.port,
  )
  const beforeDevice = keychain('read').refresh

  console.log('\nThe device grant: a sign-in that never reaches back to this machine')
  clearRecords()
  const deviceLogin = notes('login', '--device')
  const prompt = await until('the code on the terminal', () => {
    const match = deviceLogin.output.stderr.match(/go to:\s+(\S+)\s+and enter this code:\s+(\S+)/)
    return match && { uri: match[1], userCode: match[2] }
  })
  check('the code is printed with the provider`s page', prompt.uri.startsWith(recipe.issuer))
  check(
    'the code looks like XXXX-XXXX',
    /^[A-Z]{4}-[A-Z]{4}$/.test(prompt.userCode),
    prompt.userCode,
  )
  check('no browser is opened', opened().length === 0)
  check('stdout stays empty', deviceLogin.output.stdout === '')
  const started = traffic().find((call) => call.url.endsWith('/device/auth'))
  const startedParams = new URLSearchParams(started.body)
  check(
    'the device request has client_id and no secret',
    startedParams.get('client_id') === clientId &&
      !startedParams.has('client_secret') &&
      !started.authorization,
  )
  check('and names the API', startedParams.get('resource') === recipe.resource)
  const pollsOf = () => traffic().filter((call) => call.body.includes('device_code'))
  await until('the first poll', () => pollsOf().length > 0)
  check('before approval a poll is told to wait', pollsOf()[0].status === 400)
  check('and the CLI keeps waiting', deviceLogin.child.exitCode === null)

  await page.goto(prompt.uri)
  await page.screenshot({ path: join(shots, 'device-input.png') })
  await page.locator('input[name="user_code"], input[type="text"]').first().fill('BCDF-GHJK')
  await page
    .getByRole('button', { name: /continue|submit|next/i })
    .first()
    .click()
  await page
    .getByText(/not found|invalid|incorrect|expired|could not|no such/i)
    .first()
    .waitFor()
  check('a wrong code is refused on the page', true)
  check('the CLI is still waiting', deviceLogin.child.exitCode === null)

  await page.locator('input[name="user_code"], input[type="text"]').first().fill(prompt.userCode)
  await page
    .getByRole('button', { name: /continue|submit|next/i })
    .first()
    .click()
  await finishInteraction('device', async () =>
    Boolean(
      deviceLogin.child.exitCode !== null ||
      (await page.getByText(/you can close|return to|all set|approved/i).count()),
    ),
  )
  await page.screenshot({ path: join(shots, 'device-done.png') })

  const deviceDone = await deviceLogin.done
  check('`login --device` exits 0', deviceDone.code === 0, JSON.stringify(deviceDone))
  const polls = pollsOf()
  check(
    'each poll has the device grant and no secret',
    polls.every(
      (call) =>
        call.body.includes('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code') &&
        !call.body.includes('client_secret') &&
        !call.authorization,
    ),
  )
  const gaps = polls.slice(1).map((call, i) => call.at - polls[i].at)
  check(
    'polls wait the interval, so none earns slow_down',
    polls.length > 1 && gaps.every((gap) => gap >= 4900),
    gaps.join(),
  )

  const deviceKeys = keychain('read')
  check('the device sign-in is in the keychain', Boolean(deviceKeys.refresh))
  check('it replaced the earlier grant', deviceKeys.refresh !== beforeDevice)
  const superseded = await oidc
    .refreshTokenGrant(publicConfig, beforeDevice, { resource: recipe.resource })
    .then(
      () => null,
      (error) => error.error,
    )
  check('and revoked it', superseded === 'invalid_grant', superseded)
  const deviceClaims = await verifyToken((await run('token')).stdout.trim())
  console.log(`  claims: ${JSON.stringify(deviceClaims)}`)
  check('the token is for the same user', deviceClaims.sub === claims.sub)
  check('device tokens never state acr, whatever approved them', deviceClaims.acr === undefined)
  keychain('forget-access')
  const deviceRefreshed = await verifyToken((await run('token')).stdout.trim())
  check('it refreshes', deviceRefreshed.sub === claims.sub)
  check('still with no acr', deviceRefreshed.acr === undefined)

  console.log('\nA device sign-in the user turns down')
  await run('logout')
  clearRecords()
  const denied = notes('login', '--device')
  const deniedPrompt = await until('the code on the terminal', () => {
    const match = denied.output.stderr.match(/go to:\s+(\S+)\s+and enter this code:\s+(\S+)/)
    return match && { uri: match[1], userCode: match[2] }
  })
  await page.goto(deniedPrompt.uri)
  await page
    .locator('input[name="user_code"], input[type="text"]')
    .first()
    .fill(deniedPrompt.userCode)
  await page
    .getByRole('button', { name: /continue|submit|next/i })
    .first()
    .click()
  await page
    .getByRole('button', { name: /cancel|deny|abort/i })
    .first()
    .click()
  const refusal = await denied.done
  check('`login --device` exits 1', refusal.code === 1, JSON.stringify(refusal))
  const afterDenial = keychain('read')
  check('and says so', /denied/i.test(refusal.stderr), refusal.stderr)
  check('nothing reached the keychain', afterDenial.refresh === null)

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
} finally {
  await browser.close()
  keychain('delete')
  rmSync(work, { recursive: true, force: true })
}
process.exit(exitCode)
