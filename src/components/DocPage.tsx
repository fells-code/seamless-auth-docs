import { useParams, Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { useEffect, useState } from 'react'
import { DOC_INDEX, DOCS } from '../content'

export default function DocPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams()
  const slug = fixedSlug || params.slug
  if (!slug) return <Navigate to="/docs" />

  const entry = DOC_INDEX[slug]
  if (!entry) return <div>Missing doc: {slug}</div>
  const { Component } = entry

  // Previous/Next
  const idx = DOCS.findIndex((d) => d.slug === slug)
  const prev = DOCS[idx - 1]
  const next = DOCS[idx + 1]

  return (
    <div className="doc-grid">
      <article className="doc">
        <MDXProvider components={components}>
          <Component />
        </MDXProvider>
      </article>

      <aside className="doc-aside">
        <TableOfContents />
        <div className="pager">
          {prev && <a href={`/docs/${prev.slug}`}>&larr; {prev.title}</a>}
          {next && <a href={`/docs/${next.slug}`}>{next.title} &rarr;</a>}
        </div>
      </aside>
    </div>
  )
}

function extractText(node: ReactNode): string {
  console.log(node)
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

const components = {
  h2: (props) => {
    const id = slugify(extractText(props.children))
    return <h2 id={id} {...props} />
  },
  h3: (props) => {
    const id = slugify(extractText(props.children))
    return <h3 id={id} {...props} />
  },
}

function TableOfContents() {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const location = useLocation()

  useEffect(() => {
    const activeEl = document.querySelector('.toc-item.active')
    activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeId])

  useEffect(() => {
    // re-scan headings each time route changes
    const elems = Array.from(document.querySelectorAll('.doc h2, .doc h3')) as HTMLHeadingElement[]
    const data = elems.map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: Number(el.tagName.charAt(1)),
    }))
    setHeadings(data)

    // scroll spy logic
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id
          if (entry.isIntersecting) setActiveId(id)
        })
      },
      {
        rootMargin: '-10% 0px -15% 0px',
        threshold: [0, 0.25, 0.5, 1],
      },
    )
    elems.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        // activate last heading when bottom reached
        const last = headings[headings.length - 1]
        if (last) setActiveId(last.id)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  useEffect(() => {
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
  }, [])

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  if (!headings.length) return null

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
              href={`#${h.text}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(h.id)
                if (el) {
                  // Manual smooth scroll ensures consistent offset behavior
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
