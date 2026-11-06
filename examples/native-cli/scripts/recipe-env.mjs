// Prints the CLI's settings for a running local recipe, as shell exports:
//   eval "$(node scripts/recipe-env.mjs /path/to/seamless-auth-oidc-provider/local)"
import { readRecipe } from './recipe.mjs'

const [recipeDir] = process.argv.slice(2)
if (!recipeDir) {
  console.error('Usage: node scripts/recipe-env.mjs <the recipe local directory>')
  process.exit(1)
}
const { cli } = readRecipe(recipeDir)
if (!cli.OIDC_CLIENT_ID) {
  console.error('Run scripts/register-client.mjs first.')
  process.exit(1)
}
for (const [name, value] of Object.entries(cli)) {
  console.log(`export ${name}='${value}'`)
}
