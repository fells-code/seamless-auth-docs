import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Compares the "Latest release" column of the Compatibility Matrix against what is
// actually released: `npm view` for published packages, and the latest GitHub release
// for the two components that ship as images rather than npm packages. It needs the
// network, so it runs as `npm run check:matrix` and on a schedule, never in `lint`.
const file = process.argv[2] ?? 'src/content/docs/build/ecosystem.mdx'

// Not published to npm. Their releases are GitHub release tags such as `v0.17.0`.
const githubRepos = {
  'seamless-auth-api': 'fells-code/seamless-auth-api',
  'seamless-auth-admin-dashboard': 'fells-code/seamless-auth-admin-dashboard',
}

function readMatrix(source) {
  const lines = source.split('\n')
  const start = lines.findIndex((line) => /^## Compatibility Matrix\s*$/.test(line))
  if (start === -1) throw new Error(`No "## Compatibility Matrix" section in ${file}`)

  const header = lines.findIndex((line, i) => i > start && line.startsWith('|'))
  const columns = splitRow(lines[header])
  const versionColumn = columns.findIndex((cell) => /^(Latest release|Version on)/.test(cell))
  if (versionColumn === -1) throw new Error('The matrix has no "Latest release" column')

  const rows = []
  for (let i = header + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const cells = splitRow(lines[i])
    rows.push({ name: cells[0].replace(/`/g, ''), documented: cells[versionColumn] })
  }
  if (rows.length === 0) throw new Error('The matrix table has no rows')
  return rows
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function npmVersion(name) {
  return execFileSync('npm', ['view', name, 'version'], { encoding: 'utf8' }).trim()
}

async function githubVersion(repo) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'check-compat-matrix' }
  // Unauthenticated calls work but share a low hourly limit; CI passes its token.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers })
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`)
  const { tag_name: tag } = await res.json()
  return String(tag).replace(/^v/, '')
}

const rows = readMatrix(readFileSync(file, 'utf8'))
let drift = 0
let failed = 0

for (const { name, documented } of rows) {
  const repo = githubRepos[name]
  let released
  try {
    released = repo ? await githubVersion(repo) : npmVersion(name)
  } catch (err) {
    if (repo) {
      console.log(`skip   ${name}: could not read the latest ${repo} release (${err.message})`)
    } else {
      console.log(`error  ${name}: npm view failed (${err.message.split('\n')[0]})`)
      failed++
    }
    continue
  }

  const where = repo ? 'GitHub release' : 'npm latest'
  if (released === documented) {
    console.log(`ok     ${name} ${documented}`)
  } else {
    console.log(`drift  ${name}: matrix says ${documented}, ${where} is ${released}`)
    drift++
  }
}

console.log('')
if (drift || failed) {
  console.log(
    `${drift} package(s) drifted, ${failed} could not be checked. Update the matrix in ${file}.`,
  )
  process.exit(1)
}
console.log(`All ${rows.length} matrix versions match their latest release.`)
