import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Starlight renders the frontmatter title as the page H1, so a `# ` heading in
// the body shows the title twice and adds a second H1 to the outline.
const root = 'src/content/docs'

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.mdx?$/.test(entry.name) ? [path] : []
  })

const problems = []
for (const file of walk(root)) {
  let inFence = false
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (/^(```|~~~)/.test(line)) inFence = !inFence
      else if (!inFence && /^# /.test(line)) problems.push(`${file}:${i + 1}: ${line}`)
    })
}

if (problems.length) {
  console.error('Body H1 found. Starlight already renders the frontmatter title as the H1:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
