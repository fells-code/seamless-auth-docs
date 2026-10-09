import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'

export const SCAFFOLD_COMMAND = 'npx seamless-cli init my-app --local --yes --email=you@example.com'

const root = 'src/content/docs'

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.mdx?$/.test(entry.name) ? [path] : []
  })

// Runs at config time, before the content collection exists, so it reads the
// frontmatter itself. The id rule (lowercased path, no extension) matches the
// Starlight slugs these filenames produce.
function readPages() {
  return walk(root).map((file) => {
    const source = readFileSync(file, 'utf8')
    const frontmatter = parse(source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') ?? {}
    return {
      id: relative(root, file)
        .replace(/\.mdx?$/, '')
        .toLowerCase(),
      title: frontmatter.title,
      description: frontmatter.description,
      order: frontmatter.sidebar?.order ?? Number.POSITIVE_INFINITY,
    }
  })
}

/** Pages grouped by sidebar section, in sidebar order. */
export function pagesBySection(sections) {
  const pages = readPages()
  return sections.map(({ label, directory }) => ({
    label,
    pages: pages
      .filter((page) => page.id.startsWith(`${directory}/`))
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
  }))
}

/** The page index and getting-started notes shown in llms.txt after the summary. */
export function llmsDetails(sections, site) {
  const index = pagesBySection(sections).map(
    ({ label, pages }) =>
      `## ${label}\n\n` +
      pages
        .map((page) => `- [${page.title}](${new URL(`${page.id}.md`, site)}): ${page.description}`)
        .join('\n'),
  )
  return [
    'Scaffold a working self-hosted stack (React web app, Express API, auth server in Docker, admin console) with no prompts:',
    '```bash\n' + SCAFFOLD_COMMAND + '\n```',
    'Then run `docker compose up` in `my-app` and register with the email you passed; it becomes the first admin.',
    'Every page below is also served as Markdown at its URL plus `.md`, which is what these links point to.',
    ...index,
  ].join('\n\n')
}
