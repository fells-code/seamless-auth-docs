# Contributing to the Seamless Auth docs

Thanks for helping. Docs fixes are the most useful contribution a new user can make, because you see the gaps that people who wrote the code no longer notice.

The org-wide guidelines in [fells-code/.github](https://github.com/fells-code/.github/blob/main/CONTRIBUTING.md) and the [code of conduct](https://github.com/fells-code/.github/blob/main/CODE_OF_CONDUCT.md) apply here too. This file covers what is specific to the docs.

## Reporting a problem

[Open an issue](https://github.com/fells-code/seamless-auth-docs/issues/new/choose) with the page URL and what went wrong. For a command that failed, include the command, the output, and the versions you used (`npx seamless-cli --version`, your OS and Node version).

## Fixing it yourself

1. Use "Edit this page" at the bottom of the page, or fork and edit the file under `src/content/docs/`.
2. Check the behaviour against the code in the relevant repository. The docs describe what ships, not what is planned.
3. Run the checks before opening a pull request:

   ```bash
   npm install
   npm run typecheck
   npm run lint
   npm run build
   ```

4. Open the pull request with a [Conventional Commits](https://www.conventionalcommits.org) title, for example `docs: fix the first admin command`.

## Style

- No H1 in page content. The title comes from frontmatter, and `npm run lint` checks this.
- Prefer exact commands, routes and environment variable names over descriptions of them.
- No em dashes. Use a comma, parentheses, or a separate sentence.
- Facts about another product (pricing, features, limits) link to that vendor's own page and show the date they were checked.
- Never describe a feature as available until it has shipped in a released package.
