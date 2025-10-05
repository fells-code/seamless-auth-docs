export type DocModule = {
  default: React.ComponentType
  meta?: { title?: string; order?: number; tags?: string[]; hidden?: boolean }
}

const modules = import.meta.glob<DocModule>('/docs/**/*.mdx', { eager: true })

export type DocEntry = {
  slug: string
  title: string
  order: number
  tags: string[]
  hidden: boolean
  Component: React.ComponentType
}

const normalize = (path: string) => path.replace(/^\/docs\//, '').replace(/\.mdx$/, '')

export const DOCS: DocEntry[] = Object.entries(modules)
  .map(([path, mod]) => ({
    slug: normalize(path),
    title: mod.meta?.title || normalize(path),
    order: mod.meta?.order ?? 999,
    tags: mod.meta?.tags ?? [],
    hidden: !!mod.meta?.hidden,
    Component: mod.default,
  }))
  .filter((d) => !d.hidden)
  .sort((a, b) => a.order - b.order)

export const DOC_INDEX: Record<string, DocEntry> = Object.fromEntries(DOCS.map((d) => [d.slug, d]))
