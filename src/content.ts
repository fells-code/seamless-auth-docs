import type { ComponentType } from 'react'
import docsManifest from './generated/docs-manifest.json'

export type DocManifestEntry = {
  slug: string
  title: string
  order: number
  tags: string[]
  section: SectionKey
}

export type SectionKey =
  | 'start'
  | 'build'
  | 'understand'
  | 'operate'
  | 'troubleshooting'
  | 'reference'

export type DocModule = {
  default: ComponentType
}

export type DocEntry = {
  slug: string
  title: string
  order: number
  tags: string[]
  section: SectionKey
  load: () => Promise<ComponentType>
}

const moduleLoaders = import.meta.glob<DocModule>('/docs/**/*.mdx')

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

export const DOCS: DocEntry[] = (docsManifest as DocManifestEntry[]).map((doc) => {
  const loader = moduleLoaders[`/docs/${doc.slug}.mdx`]

  return {
    slug: doc.slug,
    title: doc.title,
    order: doc.order,
    tags: doc.tags,
    section: doc.section,
    load: async () => {
      if (!loader) {
        throw new Error(`Missing doc module for slug "${doc.slug}"`)
      }

      const mod = await loader()
      return mod.default
    },
  }
}).sort(compareDocs)

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
