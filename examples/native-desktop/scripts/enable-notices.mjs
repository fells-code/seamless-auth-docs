// Turns account notices on for the recipe's backend client, the way an operator would: the owner
// signs in with an email code, steps up with TOTP, and sets noticesEnabled through the admin API.
// TODO(fells-code/seamless-auth-oidc-provider#60): the recipe's seed does not do this yet, and its
// three records and link are otherwise everything this example needs. Delete this file once it does.
//   node scripts/enable-notices.mjs <the recipe local directory>
import { createHmac } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { readRecipe } from './recipe.mjs'

const [recipeDir] = process.argv.slice(2)
if (!recipeDir) {
  console.error('Usage: node scripts/enable-notices.mjs <the recipe local directory>')
  process.exit(1)
}
const { generated, recipe, mailboxUrl } = readRecipe(recipeDir)
const statePath = join(generated, 'seed-state.json')
const state = JSON.parse(readFileSync(statePath, 'utf8'))
const owner = recipe.mailboxOwner
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function must(method, path, { token, body } = {}) {
  const res = await fetch(`${recipe.apiUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (res.status >= 300) throw new Error(`${method} ${path}: ${res.status} ${text}`)
  return text ? JSON.parse(text) : {}
}

const codes = async () => (await fetch(`${mailboxUrl}/codes/${encodeURIComponent(owner)}`)).json()

function base32(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const c of secret.replace(/=+$/, '').toUpperCase()) {
    bits += alphabet.indexOf(c).toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function totp(secret, step) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const mac = createHmac('sha1', base32(secret)).update(counter).digest()
  const offset = mac[mac.length - 1] & 0xf
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}

// A code is single use, and the seed may have spent this step's. The state file is the seed's, so
// a later seed knows what was spent here too.
async function freshTotp() {
  const current = () => Math.floor(Date.now() / 30000)
  if (state.lastTotpStep !== undefined && current() <= state.lastTotpStep) {
    await sleep((state.lastTotpStep + 1) * 30000 - Date.now() + 500)
  }
  state.lastTotpStep = current()
  writeFileSync(statePath, JSON.stringify(state, null, 2), { mode: 0o600 })
  return totp(state.ownerTotpSecret, state.lastTotpStep)
}

const before = (await codes()).length
const started = await must('POST', '/login', { body: { identifier: owner } })
await must('GET', '/otp/generate-login-email-otp', { token: started.token })
let code
for (let i = 0; i < 40 && !code; i += 1) {
  const all = await codes()
  if (all.length > before) code = all.at(-1)
  else await sleep(250)
}
if (!code) throw new Error(`no code reached the mailbox for ${owner}`)
const { token } = await must('POST', '/otp/verify-login-email-otp', {
  token: started.token,
  body: { verificationToken: code },
})
await must('POST', '/totp/verify-mfa', { token, body: { code: await freshTotp() } })

const { application } = await must('PATCH', `/admin/applications/${recipe.backendClientId}`, {
  token,
  body: { noticesEnabled: true },
})
console.log(`noticesEnabled is ${application.noticesEnabled} on ${application.name}`)
