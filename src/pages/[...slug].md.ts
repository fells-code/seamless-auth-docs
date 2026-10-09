import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'

export const getStaticPaths = (async () => {
  const docs = await getCollection('docs')
  return docs.map((doc) => ({ params: { slug: doc.id }, props: { doc } }))
}) satisfies GetStaticPaths

// The MDX source as Markdown: component imports are dropped, and the few
// components a page uses (Aside, Card, Image) stay as readable tags.
function toMarkdown(doc: CollectionEntry<'docs'>): string {
  let inFence = false
  const body = (doc.body ?? '')
    .split('\n')
    .filter((line) => {
      if (/^(```|~~~)/.test(line)) inFence = !inFence
      return inFence || !/^import\s.+\sfrom\s/.test(line)
    })
    .join('\n')
    .trim()
  const header = [`# ${doc.data.title}`]
  if (doc.data.description) header.push(`> ${doc.data.description}`)
  return `${header.join('\n\n')}\n\n${body}\n`
}

export const GET: APIRoute<{ doc: CollectionEntry<'docs'> }> = ({ props }) =>
  new Response(toMarkdown(props.doc), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
