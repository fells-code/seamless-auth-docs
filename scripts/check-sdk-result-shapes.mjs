import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Every request method on the React and client SDKs resolves to
// `{ data, error }`. Examples written for the older return values read
// `response.ok`, `.success`, or payload fields straight off the result, which
// does not type-check and branches on `undefined` at runtime. This flags any
// property other than `data` or `error` read from an SDK call's result inside
// a code block. Results of `fetch(...)` and `authorizedFetch(...)` are real
// `Response` objects and are left alone.
const root = 'src/content/docs'

const sdkMethods = [
  'getCurrentUser',
  'login',
  'loginWithPasskey',
  'handlePasskeyLogin',
  'logout',
  'logoutAllSessions',
  'deleteUser',
  'register',
  'refreshSession',
  'requestPhoneOtp',
  'verifyPhoneOtp',
  'requestLoginPhoneOtp',
  'verifyLoginPhoneOtp',
  'requestEmailOtp',
  'verifyEmailOtp',
  'requestLoginEmailOtp',
  'verifyLoginEmailOtp',
  'requestMagicLink',
  'checkMagicLink',
  'verifyMagicLink',
  'listOAuthProviders',
  'getPublicSystemConfig',
  'startOAuthLogin',
  'finishOAuthLogin',
  'registerPasskey',
  'getStepUpStatus',
  'refreshStepUpStatus',
  'verifyStepUpWithPasskey',
  'verifyStepUpWithPasskeyPrf',
  'getTotpStatus',
  'startTotpEnrollment',
  'verifyTotpEnrollment',
  'disableTotp',
  'verifyStepUpWithTotp',
  'updateCredential',
  'deleteCredential',
  'listOrganizations',
  'createOrganization',
  'getOrganization',
  'updateOrganization',
  'switchOrganization',
  'listOrganizationMembers',
  'addOrganizationMember',
  'updateOrganizationMember',
  'removeOrganizationMember',
]

const call = `(?:[\\w.]+\\.)?(?:${sdkMethods.join('|')})\\(`
const resultKeys = new Set(['data', 'error'])

const boundResult = new RegExp(`\\b(?:const|let|var)\\s+(\\w+)\\s*=\\s*await\\s+${call}`)
const boundOther = /\b(?:const|let|var)\s+(\w+)\s*=/
const destructured = new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*await\\s+${call}`)
const inlineRead = new RegExp(
  `\\(\\s*await\\s+${call}[^()]*(?:\\([^()]*\\)[^()]*)*\\)\\s*\\)\\??\\.(\\w+)`,
  'g',
)
const thenParam = new RegExp(`${call}.*\\.then\\(\\s*\\(?\\s*(\\w+)\\s*\\)?\\s*=>`)

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.mdx?$/.test(entry.name) ? [path] : []
  })

const problems = []
for (const file of walk(root)) {
  let inFence = false
  let results = new Set()

  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const where = `${file}:${i + 1}: ${line.trim()}`

      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence
        results = new Set()
        return
      }
      if (!inFence) return

      const bound = line.match(boundResult)
      if (bound) results.add(bound[1])
      else {
        const other = line.match(boundOther)
        if (other) results.delete(other[1])
      }

      const then = line.match(thenParam)
      if (then) results.add(then[1])

      const names = line.match(destructured)
      if (names) {
        for (const name of names[1].split(',')) {
          const key = name.split(':')[0].trim()
          if (key && !resultKeys.has(key)) problems.push(where)
        }
      }

      for (const [, key] of line.matchAll(inlineRead)) {
        if (!resultKeys.has(key)) problems.push(where)
      }

      for (const name of results) {
        for (const [, key] of line.matchAll(new RegExp(`\\b${name}\\??\\.(\\w+)`, 'g'))) {
          if (!resultKeys.has(key)) problems.push(where)
        }
      }
    })
}

if (problems.length) {
  console.error(
    'SDK request methods resolve to { data, error }. Read only `data` or `error` off the result:',
  )
  for (const problem of new Set(problems)) console.error(`  ${problem}`)
  process.exit(1)
}
