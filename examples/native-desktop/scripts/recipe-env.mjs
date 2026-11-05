// Prints one side's settings for a running local recipe, as shell exports:
//   eval "$(node scripts/recipe-env.mjs backend /path/to/seamless-auth-oidc-provider/local)"
//   eval "$(node scripts/recipe-env.mjs app /path/to/seamless-auth-oidc-provider/local)"
import { readRecipe } from './recipe.mjs'

const [side, recipeDir] = process.argv.slice(2)
if (!['app', 'backend'].includes(side) || !recipeDir) {
  console.error('Usage: node scripts/recipe-env.mjs <app|backend> <the recipe local directory>')
  process.exit(1)
}
for (const [name, value] of Object.entries(readRecipe(recipeDir)[side])) {
  console.log(`export ${name}='${value}'`)
}
