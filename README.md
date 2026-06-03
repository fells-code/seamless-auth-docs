# Seamless Auth Docs

This repository contains the docs site for the Seamless Auth ecosystem.

It is a React + Vite + MDX application that publishes product documentation for:

- `seamless-cli`
- `seamless-auth-api`
- `@seamless-auth/core`
- `@seamless-auth/express`
- `@seamless-auth/react`
- `seamless-auth-admin-dashboard`

## Goals

The docs should work well for both humans and agents.

That means they should:

- explain package boundaries clearly
- reflect the current behavior of sibling repos
- separate shipped functionality from planned functionality
- provide both walkthroughs and technical reference material

## Current Scope

The docs are in a strong place for:

- ecosystem/package discovery
- local scaffolding and operator setup
- auth API, server SDK, React SDK, and admin dashboard reference
- route, env var, and CLI lookup

The next major docs expansion should happen when the Seamless CLI can:

- provision deployment infrastructure directly
- guide Seamless Auth integration into an existing project

Until then, keep deployment and existing-project integration language clearly labeled as in progress
or planned.

## Local Development

Install dependencies:

```bash
npm install
```

Start the docs site:

```bash
npm run dev
```

The local site runs on [http://localhost:5170](http://localhost:5170).

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

`npm run build` also regenerates `public/sitemap.xml`.

Both `npm run dev` and `npm run build` also regenerate:

- `public/search-index.json`
- `src/generated/docs-manifest.json`

## Content Structure

```txt
docs/
  start/
  build/
  understand/
  operate/
  troubleshooting/
  reference/
```

Page metadata and section ordering are managed in `src/content.ts`.

## Agent Guidance

If you are making docs changes, read [AGENTS.md](./AGENTS.md) first.
