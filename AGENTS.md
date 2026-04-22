# AGENTS.md

This file is for coding agents working in the Seamless Auth docs repository.

The goal of this repo is not just to publish a nice docs website. It should become a dependable source of truth for both humans and AI agents trying to understand the Seamless Auth ecosystem.

Use this file to keep changes aligned with that goal.

## Purpose

This project is a React/Vite documentation site for Seamless Auth.

The docs should help readers do three things well:

- understand what each part of the Seamless Auth ecosystem is for
- make good implementation decisions quickly
- find exact commands, routes, packages, and operational details without guesswork

The site should read like product documentation and technical reference, not like a starter-template README and not like a marketing microsite.

## What Counts As Source Of Truth

When updating docs, prefer checking the actual sibling repositories before making claims.

Primary neighboring repos:

- `../seamless-auth-api`
- `../seamless-auth-server`
- `../seamless-auth-admin-dashboard`
- `../seamless-auth-react`

When touching CLI docs, also inspect:

- `../create-seamless`

Do not preserve outdated claims just because they already exist in `/docs`.

If the code and the docs disagree, treat the code as authoritative unless the user explicitly says the docs are intentionally describing planned behavior.

## Documentation Standard

This repo needs to serve both humans and agents. That means docs should be:

- explicit about package names, route paths, env vars, and commands
- clear about ownership boundaries between repos and packages
- honest about maturity: shipped, experimental, in progress, planned
- structured so a reader can skim top-down and still find exact implementation details

When writing or editing content:

- lead with what the thing is and when to use it
- explain how it relates to the rest of the ecosystem
- include exact identifiers where possible
- prefer concrete examples over vague claims
- distinguish current behavior from intended future behavior

Avoid:

- hand-wavy ecosystem summaries without package boundaries
- roadmap language presented as if it already ships
- generic “AI prompt” filler unless it truly adds value
- screenshots standing in for missing technical explanation

## Current Site Architecture

The docs site is intentionally simple.

- `docs/`: MDX content files
- `src/generated/docs-manifest.json`: generated doc metadata used for navigation and ordering
- `src/content.ts`: builds the doc registry from the generated manifest and lazy MDX loaders
- `src/main.tsx`: router setup
- `src/layouts/DocsLayout.tsx`: outer shell with sidebar, search, and meta rail
- `src/components/DocPage.tsx`: MDX page renderer, lazy page loading, previous/next pager, and table of contents
- `src/components/Search.tsx`: lazy-loaded search UI backed by the generated search index
- `src/components/mdx/*`: custom MDX components available to docs
- `public/`: static images plus generated `sitemap.xml` and `search-index.json`
- `scripts/generate-sitemap.mjs`: generates the sitemap, search index, and docs manifest before dev/build

Keep the architecture lightweight unless there is a strong reason to add complexity.

## Routing Model

Current route behavior:

- `/` renders the docs layout and defaults to `start/overview`
- `/docs` also renders the docs layout and defaults to `start/overview`
- `*` under those layouts resolves through `DocPage`

This means the site currently supports both root-level docs URLs and `/docs/*` URLs.

When changing routing:

- preserve existing deep links unless the user explicitly wants a URL migration
- update previous/next navigation expectations
- update sitemap generation
- sanity-check search navigation

## MDX Conventions

Each doc should export a `meta` object when possible:

```tsx
export const meta = {
  title: 'Page Title',
  order: 1,
  section: 'start',
  tags: ['sdk', 'react'],
}
```

Available sections are currently:

- `start`
- `build`
- `understand`
- `operate`
- `troubleshooting`
- `reference`

Section order is controlled in `src/content.ts`.

Important notes:

- `build` and `reference` are now real parts of the docs IA and should stay distinct from `start`
- tags matter because search indexes title, tags, headings, excerpt text, and slug text
- slugs are derived from file paths under `docs/`

If you add docs, prefer placing them in the right section instead of overloading `start`.

## Available MDX Components

These components are wired into `DocPage` and should be reused instead of inventing ad hoc HTML patterns:

- `Callout`
- `Card`
- `Image`
- fenced code blocks via `CodeBlock`

When adding diagrams or screenshots:

- prefer explanation first, image second
- keep images in `public/`
- use stable descriptive filenames
- do not rely on images as the only source of technical truth

## Search Behavior

Search is intentionally lightweight.

Current index inputs:

- doc title
- doc section
- doc tags
- doc headings
- doc excerpt
- slug text

Search is generated at build/dev time into `public/search-index.json`, and `flexsearch` is loaded
on demand in the client.

Search still does not index full MDX body content exhaustively.

That means:

- titles should be specific
- tags should be meaningful
- the first explanatory paragraph on a page should be strong enough to serve as a useful excerpt
- file paths should reflect the actual topic

If search quality matters for a change, improve titles/tags/slug organization before reaching for a more complex search system.

## Styling And UX

This is a docs app, not an admin app and not a design playground.

Current UX pattern:

- dark shell
- left navigation
- main article column
- right-side resource rail / table of contents

When touching styles:

- prefer extending the existing CSS token system in `src/index.css`
- preserve readability over visual novelty
- optimize for long-form reading and scanning
- make code blocks, callouts, headings, and navigation clearer rather than flashier

Avoid introducing a second styling approach or a component framework unless explicitly requested.

## Known Rough Edges

These are current issues worth keeping in mind while working here.

### Content and information architecture

- reference coverage is much better than before, but deeper operational docs are still missing
- deployment guidance is intentionally status-based because deploy automation is not publicly shipped
- “integrate Seamless Auth into an existing project” docs are still thinner than greenfield/local-stack docs
- current docs are strongest for ecosystem understanding, local setup, package boundaries, and route/env lookup

### Sitemap generation

- `scripts/generate-sitemap.mjs` now generates sitemap, search index, and docs manifest from MDX files
- if metadata parsing rules change, update the generator and validate all three outputs
- build success is a good signal now, but still spot-check generated outputs after structural changes

### Layout and resources

- the layout is now ecosystem-aware, but navigation and right-rail links still need occasional pruning
- if new major repos or surfaces are added, update shell links and “find your path” guidance together

### Search limitations

- search depends heavily on metadata quality and first-paragraph clarity
- ranking is intentionally simple; weak titles, thin tags, or vague intros still hurt discoverability

## Current Product State

Docs in this repo should reflect the current product boundary clearly:

- strong today: ecosystem overview, local scaffolding, auth API/server/react/admin package docs, route/env/CLI reference
- in progress: a fuller deployment workflow
- not yet a mature docs area: guided integration of Seamless Auth into an existing non-Seamless project

If a user asks for docs work beyond that boundary, do one of two things:

- document only what is verifiably shipped today
- label future-facing material as planned, in progress, or not yet public

## Preferred Documentation Patterns

Bias toward these patterns:

- ecosystem page -> package page -> task guide -> reference page
- concept pages that explain boundaries and tradeoffs
- task guides that show exact commands and expected outcomes
- reference pages with concrete identifiers and low ambiguity
- tables for package comparison, env vars, routes, and feature support

For package docs, prefer a consistent structure:

1. what it is
2. when to use it
3. how it fits into Seamless Auth
4. core concepts or APIs
5. setup/integration example
6. operational notes or caveats
7. related docs

## Patterns To Avoid

Avoid creating more of the existing problems:

- treating screenshots as documentation
- mixing roadmap and current-state language without labels
- burying package names under vague ecosystem wording
- duplicating the same explanation across multiple pages with slight wording changes
- writing docs that only make sense if the reader already knows the architecture

## Safe Workflow For Agents

When making docs changes:

1. inspect the relevant source repo first
2. identify whether the page is conceptual, procedural, or reference material
3. update MDX content and metadata together
4. keep section placement and slugs intentional
5. update images or resource links only if they still support the written content
6. if page inventory, metadata shape, or URLs changed, run `scripts/generate-sitemap.mjs`
7. run `npm run lint`
8. run `npm run typecheck`
9. run `npm run build`

If you change core rendering behavior, also inspect:

- `src/content.ts`
- `src/components/DocPage.tsx`
- `src/layouts/DocsLayout.tsx`
- `src/components/Search.tsx`
- `vite.config.ts`

## Good First Refactor Direction

The next healthy evolution of this repo is likely:

- deepen deployment docs once the CLI can actually provision infrastructure
- add stronger “existing project integration” guides once that workflow is real in source repos
- expand reference coverage around cookies, auth modes, system config, and deployment surfaces
- continue tightening cross-links and decision guidance as the ecosystem grows

Agents should support that direction unless the user asks for something else.
