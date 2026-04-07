import { useEffect, useMemo, useState } from 'react'
import FlexSearch, { Index } from 'flexsearch'
import { DOCS } from '../content'
import { useNavigate } from 'react-router-dom'

export default function Search() {
  const nav = useNavigate()

  const [q, setQ] = useState('')
  const [results, setResults] = useState<{ slug: string; title: string }[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const index = useMemo(() => {
    const idx = new FlexSearch.Index({
      tokenize: 'forward',
      resolution: 9,
    }) as Index

    DOCS.forEach((d) => {
      // @ts-expect-error package issues
      idx.add(d.slug, [d.title, d.tags.join(' '), d.slug.replaceAll('/', ' ')].join(' '))
    })

    return idx
  }, [])

  useEffect(() => {
    if (!q) {
      setResults([])
      return
    }

    const ids = (index.search(q) as string[]).slice(0, 8)

    setResults(
      ids.map((slug) => ({
        slug,
        title: DOCS.find((d) => d.slug === slug)!.title,
      })),
    )

    setActiveIndex(0)
  }, [q, index])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
    <div className="search">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search docs…"
        aria-label="Search"
      />

      {!!results.length && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={r.slug}>
              <button
                className={i === activeIndex ? 'active' : ''}
                onClick={() => nav(`/docs/${r.slug}`)}
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
