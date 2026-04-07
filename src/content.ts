export type SectionKey =
  | 'start'
  | 'build'
  | 'understand'
  | 'operate'
  | 'troubleshooting'
  | 'reference'

export type DocModule = {
  default: React.ComponentType
  meta?: {
    title?: string
    order?: number
    tags?: string[]
    hidden?: boolean
    section?: SectionKey
  }
}

export type DocEntry = {
  slug: string
  title: string
  order: number
  tags: string[]
  hidden: boolean
  section: SectionKey
  Component: React.ComponentType
}

const modules = import.meta.glob<DocModule>('/docs/**/*.mdx', { eager: true })

function getPathParts(path: string) {
  return path
    .replace(/^\/docs\//, '')
    .replace(/\.mdx$/, '')
    .split('/')
}

export const DOC_SECTIONS: Record<SectionKey, string> = {
  start: 'Start',
  build: 'Build',
  understand: 'Understand',
  operate: 'Operate',
  troubleshooting: 'Troubleshooting',
  reference: 'Reference',
}

const SECTION_ORDER: SectionKey[] = [
  'start',
  'build',
  'understand',
  'operate',
  'troubleshooting',
  'reference',
]

function compareDocs(a: DocEntry, b: DocEntry) {
  const sectionDiff = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section)

  if (sectionDiff !== 0) return sectionDiff

  if (a.order !== b.order) return a.order - b.order

  return a.title.localeCompare(b.title)
}

export const DOCS: DocEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const parts = getPathParts(path)
    const inferredSection = parts[0] as SectionKey

    return {
      slug: parts.join('/'),
      title: mod.meta?.title || parts[parts.length - 1],
      order: mod.meta?.order ?? 999,
      tags: mod.meta?.tags ?? [],
      hidden: !!mod.meta?.hidden,
      section: mod.meta?.section ?? inferredSection ?? 'reference',
      Component: mod.default,
    }
  })
  .filter((d) => !d.hidden)
  .sort(compareDocs)

export const DOCS_BY_SECTION: Record<SectionKey, DocEntry[]> = {
  start: [],
  build: [],
  understand: [],
  operate: [],
  troubleshooting: [],
  reference: [],
}

DOCS.forEach((doc) => {
  DOCS_BY_SECTION[doc.section].push(doc)
})

Object.values(DOCS_BY_SECTION).forEach((docs) => {
  docs.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title)
  })
})

export const DOC_INDEX: Record<string, DocEntry> = Object.fromEntries(DOCS.map((d) => [d.slug, d]))
