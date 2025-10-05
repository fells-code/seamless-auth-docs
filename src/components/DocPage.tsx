import { useParams, Navigate } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { DOC_INDEX, DOCS } from '../content'
import Toc from './Toc'

const components = {
  h2: (props) => <h2 id={slugify(props.children)} {...props} />,
  h3: (props) => <h3 id={slugify(props.children)} {...props} />,
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

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
      <MDXProvider components={components}>
        <Component />
      </MDXProvider>
      <aside className="doc-aside">
        <Toc />
        <div className="pager">
          {prev && <a href={`/docs/${prev.slug}`}>&larr; {prev.title}</a>}
          {next && <a href={`/docs/${next.slug}`}>{next.title} &rarr;</a>}
        </div>
      </aside>
    </div>
  )
}
