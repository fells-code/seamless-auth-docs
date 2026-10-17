# AGENTS.md

This file is for coding agents working in the Seamless Auth docs repository.

The goal of this repo is not just to publish a nice docs website. It should become a dependable source of truth for both humans and AI agents trying to understand the Seamless Auth ecosystem.

Use this file to keep changes aligned with that goal.

## Working Standards (fells-code baseline)

These rules apply to every repository in the fells-code org. Repo-specific
guidance may extend them but must not contradict them.

### Attribution

- Commit and open PRs solely under the repository owner's identity. Never
  commit under an agent or assistant identity.
- Never attribute work to an AI assistant: no `Co-Authored-By: Claude` (or any
  assistant) trailers, no "Generated with" / "Created with Claude" notes, and no
  assistant branding or emoji anywhere in commit messages, PR or issue titles
  and descriptions, changesets, code comments, or docs.

### Comments

- Comment only when the code genuinely needs explaining: a non-obvious reason, a
  gotcha, or an invariant. Never narrate what the code plainly does.

### TODOs

- Every `TODO`/`FIXME` must reference a ticket, e.g. `// TODO(#123): ...`.
  Do not leave a bare TODO. If no ticket exists, create one first.

### Commits & branches

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `test:`).
- Descriptive branch names (`feat/...`, `fix/...`); never a `claude/` or other
  tool-generated prefix.

### Public-facing text

- No em dashes in commit messages, code comments, PR or issue text, changesets,
  or docs. Use a comma, parentheses, or a separate sentence.

### Before declaring work done

- All code quality checks must pass before you open a PR or call the work done:
  tests, linting, type checks, and formatting. Run them and report the real
  output; do not open a PR while any check is failing.
- Typical commands: `npm run lint`, `npm run typecheck` (astro check), and
  `npm run build`. Never claim a change works without running them.
- Match the surrounding code's style, naming, and comment density.

## Purpose

This project is an Astro Starlight documentation site for Seamless Auth.

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

- `../seamless-cli`

Do not preserve outdated claims just because they already exist in `src/content/docs`.

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

The site is an Astro Starlight static site. Every page is prerendered to
static HTML at build time, so content and per-page meta are present without
running JavaScript.

- `src/content/docs/`: MDX content, organized by section directory
- `src/content.config.ts`: the Starlight `docs` content collection (loader plus schema)
- `astro.config.mjs`: Starlight integration, sidebar groups, `site`, redirects, and the sitemap integration
- `src/components/Image.astro`: caption-aware screenshot component used from MDX
- `src/llms.mjs`: builds the page index and getting-started notes for `/llms.txt` (the `starlight-llms-txt` plugin also emits `/llms-full.txt` and `/llms-small.txt`)
- `src/pages/[...slug].md.ts`: serves a Markdown copy of every page at its URL plus `.md`
- `src/styles/custom.css`: brand accent layered on Starlight's theme
- `public/`: static images and `robots.txt`
- `dist/`: build output (deployed as static)

Search is Starlight's built-in Pagefind full-text index (generated at build);
there is no separate search index or manifest to maintain. Keep the
architecture lightweight unless there is a strong reason to add complexity.

## Routing Model

- Pages are served at top-level routes derived from their path under
  `src/content/docs/`, for example `start/overview.mdx` serves at
  `/start/overview`. Starlight lowercases slugs.
- `/` and the legacy `/docs/*` deep links 301-redirect to the current routes
  (configured in `astro.config.mjs`).

When changing routing:

- preserve existing deep links; add a redirect in `astro.config.mjs` when a URL changes
- the sidebar and previous/next navigation come from `sidebar.order` frontmatter and the sidebar groups in `astro.config.mjs`
- the sitemap is generated by `@astrojs/sitemap`; no manual step

## MDX Conventions

Each doc uses Starlight frontmatter. `title` is required; `description` feeds
the meta description, the social preview, and the page's one-line entry in
`/llms.txt`, so keep it accurate and specific (one sentence, single line).

```mdx
---
title: Page Title
description: One sentence describing the page for search and social previews.
sidebar:
  order: 1
---
```

The section is determined by the directory the file lives in. Available
sections are `start`, `build`, `understand`, `operate`, `compare`, `troubleshooting`,
and `reference`, ordered by the sidebar groups in `astro.config.mjs`. Prefer
placing new docs in the right section instead of overloading `start`.

## Available MDX Components

Import components at the top of the MDX file:

- `Aside` and `Card` from `@astrojs/starlight/components`
- `Image` from `../../../components/Image.astro` (adds a caption under the screenshot)
- fenced code blocks are highlighted by Starlight's built-in Expressive Code

When adding diagrams or screenshots:

- prefer explanation first, image second
- keep images in `public/`
- use stable descriptive filenames
- do not rely on images as the only source of technical truth

## Search Behavior

Search is Starlight's built-in Pagefind index, generated at build time from
the rendered page content. Titles and the first explanatory paragraph still
matter most for discoverability, so keep them specific.

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

- prefer Starlight's CSS custom properties, overriding them in `src/styles/custom.css`
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

### Sitemap and search

- the sitemap is generated by `@astrojs/sitemap` and search by Starlight's Pagefind, both at build time
- there is no manual generation step; spot-check `dist/sitemap-0.xml` after adding or renaming pages

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
3. update MDX content and frontmatter together
4. keep section placement (directory) and slugs intentional; add a redirect in `astro.config.mjs` if a URL changes
5. update images or resource links only if they still support the written content
6. run `npm run lint`
7. run `npm run typecheck`
8. run `npm run build`

If you change core rendering behavior, also inspect:

- `astro.config.mjs`
- `src/content.config.ts`
- `src/components/Image.astro`
- `src/styles/custom.css`

## Good First Refactor Direction

The next healthy evolution of this repo is likely:

- deepen deployment docs once the CLI can actually provision infrastructure
- add stronger “existing project integration” guides once that workflow is real in source repos
- expand reference coverage around cookies, auth modes, system config, and deployment surfaces
- continue tightening cross-links and decision guidance as the ecosystem grows

Agents should support that direction unless the user asks for something else.
