import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Every @seamless-auth/client and @seamless-auth/react request method resolves to
// `{ data, error }`, never a `Response`. Examples written for the old return values
// (`response.ok`, `await response.json()`, `result.success`, `result.providers`)
// type-check against nothing and branch on `undefined` when run.
//
// The check is scoped to values that came from an SDK call, so a raw `fetch()` or
// `authorizedFetch()` example, which really does return a `Response`, is left alone.
const root = process.argv[2] ?? 'src/content/docs'

// Request methods on SeamlessAuthClient and AuthContextType. `authorizedFetch` and
// `isPasskeyPrfSupported` are deliberately absent: they do not return a result.
const sdkMethods = [
  'addOrganizationMember',
  'checkMagicLink',
  'createOrganization',
  'deleteCredential',
  'deleteUser',
  'disableTotp',
  'finishOAuthLogin',
  'getCurrentUser',
  'getOrganization',
  'getPublicSystemConfig',
  'getStepUpStatus',
  'getTotpStatus',
  'handlePasskeyLogin',
  'listOAuthProviders',
  'listOrganizationMembers',
  'listOrganizations',
  'login',
  'loginWithPasskey',
  'logout',
  'logoutAllSessions',
  'refreshSession',
  'refreshStepUpStatus',
  'register',
  'registerPasskey',
  'removeOrganizationMember',
  'requestEmailOtp',
  'requestLoginEmailOtp',
  'requestLoginPhoneOtp',
  'requestMagicLink',
  'requestPhoneOtp',
  'startOAuthLogin',
  'startTotpEnrollment',
  'switchOrganization',
  'updateCredential',
  'updateOrganization',
  'updateOrganizationMember',
  'verifyEmailOtp',
  'verifyLoginEmailOtp',
  'verifyLoginPhoneOtp',
  'verifyMagicLink',
  'verifyPhoneOtp',
  'verifyStepUpWithPasskey',
  'verifyStepUpWithPasskeyPrf',
  'verifyStepUpWithTotp',
  'verifyTotpEnrollment',
]

const call = `(?:[\\w.]+\\.)?(?:${sdkMethods.join('|')})\\s*\\(`
// `const result = await login(...)` binds `result` to an SDK result.
const boundByAwait = new RegExp(`\\b(?:const|let|var)\\s+(\\w+)\\s*=\\s*await\\s+${call}`, 'g')
// `listOAuthProviders().then((result) => ...)` binds `result` the same way.
const boundByThen = new RegExp(`${call}[^)]*\\)\\s*\\.then\\(\\s*\\(?\\s*(\\w+)\\s*\\)?\\s*=>`, 'g')
// `(await verifyStepUpWithPasskey()).success` reads a field straight off the result.
const awaitedField = new RegExp(
  `\\(\\s*await\\s+${call}[^()]*(?:\\([^()]*\\)[^()]*)*\\)\\s*\\)\\s*\\??\\.\\s*(\\w+)`,
  'g',
)

// A result has exactly two fields. Anything else read off it is an old shape.
const resultFields = new Set(['data', 'error'])

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.mdx?$/.test(entry.name) ? [path] : []
  })

const fences = (source) => {
  const blocks = []
  let block = null
  source.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      if (block) {
        blocks.push(block)
        block = null
      } else {
        block = { start: i + 2, lines: [] }
      }
    } else if (block) {
      block.lines.push(line)
    }
  })
  return blocks
}

const problems = []
for (const file of walk(root)) {
  for (const block of fences(readFileSync(file, 'utf8'))) {
    const code = block.lines.join('\n')
    const bound = new Set()
    for (const pattern of [boundByAwait, boundByThen]) {
      for (const match of code.matchAll(pattern)) bound.add(match[1])
    }

    block.lines.forEach((line, i) => {
      const where = `${file}:${block.start + i}`
      for (const match of line.matchAll(awaitedField)) {
        if (!resultFields.has(match[1])) {
          problems.push(`${where}: \`.${match[1]}\` read off an SDK result: ${line.trim()}`)
        }
      }
      for (const name of bound) {
        const access = new RegExp(`(?<![\\w.])${name}\\s*\\??\\.\\s*(\\w+)`, 'g')
        for (const match of line.matchAll(access)) {
          if (!resultFields.has(match[1])) {
            problems.push(
              `${where}: \`${name}.${match[1]}\` read off an SDK result: ${line.trim()}`,
            )
          }
        }
      }
    })
  }
}

if (problems.length) {
  console.error(
    'SDK results are { data, error }, not a Response. Destructure the result, check `error`, then read `data`:',
  )
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
