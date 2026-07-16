import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.seamlessauth.com',
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
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/fells-code' }],
      editLink: {
        baseUrl: 'https://github.com/fells-code/seamless-auth-docs/edit/main/',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Start', autogenerate: { directory: 'start' } },
        { label: 'Build', autogenerate: { directory: 'build' } },
        { label: 'Understand', autogenerate: { directory: 'understand' } },
        { label: 'Operate', autogenerate: { directory: 'operate' } },
        { label: 'Troubleshooting', autogenerate: { directory: 'troubleshooting' } },
        { label: 'Reference', autogenerate: { directory: 'reference' } },
      ],
    }),
    sitemap(),
  ],
})
