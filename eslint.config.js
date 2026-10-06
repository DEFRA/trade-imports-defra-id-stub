import { globalIgnores } from 'eslint/config'
import { neostandard } from 'neostandard'

// neostandard 0.14 scopes its `ignores` option to its own layers, so the
// build output needs an explicit global ignore to stay out of every lint run.
const ignores = ['.public/**']

const eslint = neostandard({ ignores })

for (const item of eslint) {
  if (item?.languageOptions?.ecmaVersion < 2025) {
    item.languageOptions.ecmaVersion = 2025
  }
}

export default [globalIgnores(ignores), ...eslint]
