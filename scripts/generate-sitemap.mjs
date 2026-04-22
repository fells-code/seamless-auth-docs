import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const base = 'https://docs.seamlessauth.com'
const docsRoot = path.resolve('docs')
const generatedRoot = path.resolve('src/generated')

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return walk(fullPath)
    }

    if (!entry.isFile() || !entry.name.endsWith('.mdx')) {
      return []
    }

    const relativePath = path.relative(docsRoot, fullPath)
    const slug = relativePath
      .replace(/\.mdx$/, '')
      .split(path.sep)
      .join('/')

    return [
      {
        fullPath,
        relativePath,
        slug,
        urlPath: `/docs/${slug}`,
      },
    ]
  })
}

function parseMeta(source, relativePath) {
  const getStringValue = (key) =>
    (source.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`)) || [])[1] || ''

  const title = getStringValue('title') || path.basename(relativePath, '.mdx')
  const section = getStringValue('section') || relativePath.split(path.sep)[0]
  const orderMatch = source.match(/order:\s*(\d+)/)
  const order = orderMatch ? Number(orderMatch[1]) : 999
  const hidden = /hidden:\s*true/.test(source)
  const tagBlock = (source.match(/tags:\s*\[([\s\S]*?)\]/) || [])[1] || ''
  const tags = Array.from(tagBlock.matchAll(/['"]([^'"]+)['"]/g)).map((match) => match[1])

  return { title, section, order, tags, hidden }
}

function extractHeadings(source) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^##+\s+/.test(line))
    .map((line) => line.replace(/^##+\s+/, '').trim())
}

function extractExcerpt(source) {
  const lines = source.split('\n')
  let inCodeBlock = false
  let inMetaBlock = false
  const excerptLines = []

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.startsWith('export const meta')) {
      inMetaBlock = true
      continue
    }

    if (inMetaBlock) {
      if (line === '}') {
        inMetaBlock = false
      }
      continue
    }

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) continue

    if (!line) {
      if (excerptLines.length) break
      continue
    }

    if (line.startsWith('import ') || line.startsWith('export ')) {
      continue
    }

    if (
      line.startsWith('#') ||
      line.startsWith('<') ||
      line.startsWith('|') ||
      line.startsWith('- ') ||
      line.startsWith('* ') ||
      line.startsWith('```') ||
      /^\d+\.\s/.test(line)
    ) {
      if (excerptLines.length) break
      continue
    }

    excerptLines.push(
      line
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~]/g, ''),
    )
  }

  return excerptLines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 220)
}

const docRecords = walk(docsRoot).map(({ fullPath, relativePath, slug, urlPath }) => {
  const source = readFileSync(fullPath, 'utf8')
  const meta = parseMeta(source, relativePath)

  return {
    slug,
    urlPath,
    title: meta.title,
    section: meta.section,
    order: meta.order,
    tags: meta.tags,
    hidden: meta.hidden,
    headings: extractHeadings(source),
    excerpt: extractExcerpt(source),
  }
})

const visibleDocRecords = docRecords.filter((record) => !record.hidden)

const paths = ['/', '/docs', ...visibleDocRecords.map(({ urlPath }) => urlPath)].sort((a, b) =>
  a.localeCompare(b),
)

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
  .map((urlPath) => `  <url><loc>${base}${urlPath}</loc></url>`)
  .join('\n')}\n</urlset>\n`

const searchIndex = visibleDocRecords.map(
  ({ slug, title, section, tags, headings, excerpt, urlPath }) => {
    return {
      slug,
      title,
      section,
      tags,
      headings,
      excerpt,
      urlPath,
    }
  },
)

const docsManifest = visibleDocRecords.map(({ slug, title, section, order, tags }) => ({
  slug,
  title,
  section,
  order,
  tags,
}))

mkdirSync(generatedRoot, { recursive: true })

writeFileSync('public/sitemap.xml', xml)
writeFileSync('public/search-index.json', JSON.stringify(searchIndex, null, 2) + '\n')
writeFileSync(
  path.join(generatedRoot, 'docs-manifest.json'),
  JSON.stringify(docsManifest, null, 2) + '\n',
)

console.log(`Sitemap written to public/sitemap.xml with ${paths.length} URLs`)
console.log(`Search index written to public/search-index.json with ${searchIndex.length} entries`)
console.log(
  `Docs manifest written to src/generated/docs-manifest.json with ${docsManifest.length} entries`,
)
