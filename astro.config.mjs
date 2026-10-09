import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import starlightLlmsTxt from 'starlight-llms-txt'
import { llmsDetails, pagesBySection } from './src/llms.mjs'

const site = 'https://docs.seamlessauth.com'

const sections = [
  { label: 'Start', directory: 'start' },
  { label: 'Build', directory: 'build' },
  { label: 'Understand', directory: 'understand' },
  { label: 'Operate', directory: 'operate' },
  { label: 'Compare', directory: 'compare' },
  { label: 'Troubleshooting', directory: 'troubleshooting' },
  { label: 'Reference', directory: 'reference' },
]

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'ignore',
  redirects: {
    // The site used to be served under /docs/*. Preserve those deep links.
    '/': '/start/overview',
    // The portal's welcome email points new managed signups here.
    '/getting-started': '/start/managed-quickstart',
    '/docs': '/start/overview',
    '/docs/[...slug]': '/[...slug]',
    // Old mixed-case slugs now resolve to their lowercased routes.
    '/docs/start/quickStart': '/start/quickstart',
    '/docs/start/firstUser': '/start/firstuser',
    '/docs/start/firstAdmin': '/start/firstadmin',
    '/docs/start/firstPageAndRoute': '/start/firstpageandroute',
    '/docs/start/adminUi': '/start/adminui',
    '/docs/operate/CLI': '/operate/cli',
    '/docs/operate/dockerEnv': '/operate/dockerenv',
    '/docs/understand/authEvents': '/understand/authevents',
  },
  integrations: [
    starlight({
      title: 'Seamless Auth Docs',
      description:
        'Documentation and technical reference for Seamless Auth, the passwordless authentication ecosystem you run inside your own application stack.',
      favicon: '/key_s_logo.ico',
      components: {
        Footer: './src/components/Footer.astro',
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/fells-code' }],
      editLink: {
        baseUrl: 'https://github.com/fells-code/seamless-auth-docs/edit/main/',
      },
      customCss: ['./src/styles/custom.css'],
      plugins: [
        starlightLlmsTxt({
          projectName: 'Seamless Auth',
          description:
            'Seamless Auth is open source passwordless auth (passkeys, magic links, OTP) you self-host. Apache-2.0.',
          details: llmsDetails(sections, site),
          // Exact ids, most important first, so llms-full.txt follows the sidebar order.
          // Starlight's per-heading "Section titled" links are noise outside the HTML page.
          customSelectors: { all: ['.sl-anchor-link'] },
          promote: pagesBySection(sections).flatMap(({ pages }) => pages.map((page) => page.id)),
        }),
      ],
      sidebar: sections.map(({ label, directory }) => ({
        label,
        items: [{ autogenerate: { directory } }],
      })),
    }),
    sitemap(),
  ],
})
