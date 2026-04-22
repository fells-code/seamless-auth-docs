import { useEffect, useState } from 'react'
import type { Index } from 'flexsearch'
import type { KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type SearchEntry = {
  slug: string
  title: string
  section: string
  tags: string[]
  headings: string[]
  excerpt: string
}

type SearchStore = {
  entries: SearchEntry[]
  entryMap: Map<string, SearchEntry>
  index: Index
}

let searchStorePromise: Promise<SearchStore> | null = null

function loadSearchStore(): Promise<SearchStore> {
  if (!searchStorePromise) {
    searchStorePromise = Promise.all([
      fetch('/search-index.json').then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load search index')
        }

        return (await response.json()) as SearchEntry[]
      }),
      import('flexsearch'),
    ]).then(([entries, mod]) => {
      const index = new mod.default.Index({
        tokenize: 'forward',
        resolution: 9,
      }) as Index

      entries.forEach((entry) => {
        index.add(
          entry.slug,
          [
            entry.title,
            entry.section,
            entry.tags.join(' '),
            entry.headings.join(' '),
            entry.excerpt,
            entry.slug.split('/').join(' '),
          ].join(' '),
        )
      })

      return {
        entries,
        entryMap: new Map(entries.map((entry) => [entry.slug, entry])),
        index,
      }
    })
  }

  return searchStorePromise
}

export default function Search({ compact = false }: { compact?: boolean }) {
  const nav = useNavigate()
  const location = useLocation()

  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!q) {
      setResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    loadSearchStore()
      .then(({ index, entryMap }) => {
        if (cancelled) return

        const ids = (index.search(q) as string[]).slice(0, 8)

        setResults(ids.map((slug) => entryMap.get(slug)).filter(Boolean) as SearchEntry[])
        setActiveIndex(0)
        setIsSearching(false)
      })
      .catch(() => {
        if (!cancelled) {
          setResults([])
          setIsSearching(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [q])

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        loadSearchStore().catch(() => {})
      },
      compact ? 500 : 200,
    )

    return () => window.clearTimeout(timeout)
  }, [compact])

  useEffect(() => {
    setQ('')
    setResults([])
    setActiveIndex(0)
    setIsSearching(false)
  }, [location.pathname])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    }

    if (e.key === 'Enter') {
      nav(`/docs/${results[activeIndex].slug}`)
    }

    if (e.key === 'Escape') {
      setQ('')
      setResults([])
    }
  }

  return (
    <div className={`search ${compact ? 'search-compact' : ''}`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={compact ? 'Search docs…' : 'Search docs by topic'}
        aria-label="Search"
      />

      {!compact && !q && (
        <div className="search-hint">Try “routes”, “react sdk”, or “sessions”.</div>
      )}

      {!!results.length && (
        <ul className="search-results">
          {results.map((result, i) => (
            <li key={result.slug}>
              <button
                className={i === activeIndex ? 'active' : ''}
                onClick={() => nav(`/docs/${result.slug}`)}
              >
                <span className="search-result-title">{result.title}</span>
                <span className="search-result-meta">
                  {result.section} / {result.slug}
                </span>
                {!!result.excerpt && (
                  <span className="search-result-excerpt">{result.excerpt}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!!q && isSearching && <div className="search-empty">Searching docs…</div>}
      {!!q && !isSearching && !results.length && (
        <div className="search-empty">
          No matches yet. Try a route, command, package, or config key.
        </div>
      )}
    </div>
  )
}
