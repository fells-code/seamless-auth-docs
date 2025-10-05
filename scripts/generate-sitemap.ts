import { writeFileSync } from 'node:fs'
const base = 'https://docs.seamlessauth.com'
const paths = [
  '/',
  '/docs',
  '/docs/introduction',
  '/docs/getting-started',
  '/docs/react-sdk',
  '/docs/nextjs-server',
  '/docs/self-hosting',
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
  .map((p) => `<url><loc>${base}${p}</loc></url>`)
  .join('\n')}\n</urlset>`
writeFileSync('public/sitemap.xml', xml)
console.log('Sitemap written to public/sitemap.xml')
