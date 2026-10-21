# Seamless Auth Docs

The source for [docs.seamlessauth.com](https://docs.seamlessauth.com), the documentation for Seamless Auth: open source, self-hostable, passwordless authentication.

The site covers the whole ecosystem:

- `seamless-auth-api`, the auth server
- `@seamless-auth/express`, `@seamless-auth/fastify`, `@seamless-auth/nextjs` and the Go, Python and Rust server adapters
- `@seamless-auth/react`, `@seamless-auth/react-native` and the Angular, Vue and Svelte bindings
- `seamless-cli` and the starter templates
- the admin console

## Found a problem?

A wrong command, a broken link or a page that no longer matches the code is worth reporting. [Open an issue](https://github.com/fells-code/seamless-auth-docs/issues/new/choose), or use "Edit this page" at the bottom of any page to propose a fix. See [CONTRIBUTING.md](./CONTRIBUTING.md).

Security issues go to the [security policy](https://github.com/fells-code/.github/blob/main/SECURITY.md), not to a public issue.

## Local development

Node 22.12 or later (`.nvmrc` pins 24).

```bash
npm install
npm run dev
```

## Checks

CI runs these on every pull request:

```bash
npm run typecheck
npm run lint
npm run build
```

`npm run check:matrix` checks the package compatibility matrix against the published versions. It also runs weekly in CI.

## Layout

The site is built with [Astro Starlight](https://starlight.astro.build). Pages are MDX under `src/content/docs/`, one directory per sidebar section:

```txt
src/content/docs/
  start/            first run, quickstart, first admin
  build/            SDKs, adapters and integration guides
  understand/       users, sessions, auth events, data model
  operate/          deploy, CLI, migration
  compare/          honest comparisons with other auth products
  troubleshooting/
  reference/        routes, environment variables, system config
```

The sidebar is generated from these directories (`astro.config.mjs`). `/llms.txt`, `/llms-full.txt` and a Markdown copy of every page are generated at build time for coding agents.

## Writing guidance

Read [AGENTS.md](./AGENTS.md) before changing content. It applies to people as much as to agents: check claims against the code, keep shipped and planned features clearly apart, and cite a dated source for any fact about another product.

## License

Apache-2.0. See [LICENSE](./LICENSE).

Project governance, including the
[Seamless Auth License Pledge](https://github.com/fells-code/.github/blob/main/GOVERNANCE.md#the-seamless-auth-license-pledge),
is in the fells-code [GOVERNANCE.md](https://github.com/fells-code/.github/blob/main/GOVERNANCE.md).
