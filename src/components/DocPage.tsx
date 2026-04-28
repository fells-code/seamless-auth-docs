import { useParams, Navigate, useLocation, Link } from 'react-router-dom'
import { ReactNode, useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { DOC_INDEX, DOCS, DOC_SECTIONS } from '../content'
import { Callout } from './mdx/Callout'
import { Card } from './mdx/Card'
import { CodeBlock } from './mdx/CodeBlock'
import { Image } from './mdx/Image'

const components = {
  h2: (props) => {
    const id = slugify(extractText(props.children))
    return (
      <h2 id={id}>
        <a href={`#${id}`} className="heading-anchor">
          #
        </a>
        {props.children}
      </h2>
    )
  },
  h3: (props) => {
    const id = slugify(extractText(props.children))
    return <h3 id={id} {...props} />
  },
  Callout,
  Card,
  Image,
  pre: CodeBlock,
}

export default function DocPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams()
  const location = useLocation()

  const rawSlug = fixedSlug || params['*'] || ''
  const slug = normalizeDocSlug(rawSlug)
  const entry = DOC_INDEX[slug]
  const [loadedDoc, setLoadedDoc] = useState<{ slug: string; Component: ComponentType } | null>(
    null,
  )

  useEffect(() => {
    if (!entry) {
      setLoadedDoc(null)
      return
    }

    let cancelled = false

    setLoadedDoc(null)

    entry
      .load()
      .then((Component) => {
        if (!cancelled) {
          setLoadedDoc({ slug, Component })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedDoc(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [entry, slug])

  const LoadedComponent = loadedDoc?.slug === slug ? loadedDoc.Component : null

  if (!fixedSlug && rawSlug && rawSlug !== slug) {
    const normalizedPathname = location.pathname.replace(/\/+$/, '') || '/'
    return <Navigate replace to={`${normalizedPathname}${location.search}${location.hash}`} />
  }

  if (!slug) return <Navigate to="/docs" />
  if (!entry) {
    return (
      <div className="missing-doc">
        <div className="eyebrow">Missing Page</div>
        <h1>We couldn&apos;t find that document.</h1>
        <p>
          The page <code>{slug}</code> does not exist in the current docs set.
        </p>
        <div className="missing-doc-links">
          <Link to="/docs/start/overview">Go to overview</Link>
          <Link to="/docs/build/ecosystem">Open ecosystem guide</Link>
          <Link to="/docs/reference/auth-api-routes">Open reference docs</Link>
        </div>
      </div>
    )
  }
  const { title, section, tags } = entry

  const idx = DOCS.findIndex((d) => d.slug === slug)
  const prev = DOCS[idx - 1]
  const next = DOCS[idx + 1]

  return (
    <div className="doc-container">
      <article className="doc">
        <div className="doc-header">
          <div className="eyebrow">{DOC_SECTIONS[section]}</div>
          <h1>{title}</h1>
          {!!tags.length && (
            <div className="doc-tags">
              {tags.map((tag) => (
                <span key={tag} className="doc-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {LoadedComponent ? (
          // @ts-expect-error This should be okay
          <LoadedComponent components={components} />
        ) : (
          <div className="doc-loading">
            <div className="doc-loading-bar doc-loading-bar-lg" />
            <div className="doc-loading-bar" />
            <div className="doc-loading-bar doc-loading-bar-sm" />
          </div>
        )}

        <div className="pager">
          {idx > 0 && prev && (
            <Link className="pager-prev" to={`/docs/${prev.slug}`}>
              ← {prev.title}
            </Link>
          )}
          {idx < DOCS.length - 1 && next && (
            <Link className="pager-next" to={`/docs/${next.slug}`}>
              {next.title} →
            </Link>
          )}
        </div>
      </article>

      <aside className="doc-toc">
        <TableOfContents docSlug={slug} contentReady={Boolean(LoadedComponent)} />
        <div className="toc-card">
          <div className="toc-card-title">Need exact details?</div>
          <Link to="/docs/reference/auth-api-routes">Auth API Routes</Link>
          <Link to="/docs/reference/environment-variables">Environment Variables</Link>
          <Link to="/docs/reference/cli-commands">CLI Commands</Link>
        </div>
      </aside>
    </div>
  )
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && node && 'props' in node)
    // @ts-expect-error node children
    return extractText(node.props.children)
  return ''
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeDocSlug(slug: string) {
  return slug.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

function TableOfContents({
  docSlug,
  contentReady,
}: {
  docSlug: string
  contentReady: boolean
}) {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setHeadings([])
    setActiveId('')
  }, [docSlug])

  useEffect(() => {
    const activeEl = document.querySelector('.toc-item.active')
    activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeId])

  useEffect(() => {
    if (!contentReady) {
      return
    }

    const elems = Array.from(document.querySelectorAll('.doc h2, .doc h3')) as HTMLHeadingElement[]
    const data = elems.map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: Number(el.tagName.charAt(1)),
    }))
    setHeadings(data)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length > 0) {
          const id = (visible[0].target as HTMLElement).id
          setActiveId(id)
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.1, 0.25, 0.5],
      },
    )
    elems.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [contentReady, docSlug])

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        const last = headings[headings.length - 1]
        if (last) setActiveId(last.id)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  useEffect(() => {
    if (!contentReady) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.15 },
    )
    const sections = document.querySelectorAll('.doc section')
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [contentReady, docSlug])

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  if (!headings.length) return null
  if (isMobile) return null

  return (
    <nav className="toc">
      <div className="toc-title">On this page</div>
      <ul>
        {headings.map((h) => (
          <li
            key={h.id}
            className={`toc-item level-${h.level} ${activeId === h.id ? 'active' : ''}`}
          >
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(h.id)
                if (el) {
                  window.scrollTo({
                    top: el.getBoundingClientRect().top + window.scrollY - 80,
                    behavior: 'smooth',
                  })
                }
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
