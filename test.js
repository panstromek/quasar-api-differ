// https://api.github.com/repos/quasarframework/quasar-framework.org/commits?path=themes/quasar/scripts/page-helpers.js
// https://api.github.com/repos/quasarframework/quasar-framework.org/commits?path=themes/quasar/scripts/page-helpers.js&per_page=1

const fs = require('fs')
const before = fs.readFileSync('./api-diff.md').toString()

require('./jsonDiffer')

const after = fs.readFileSync('./api-diff.md').toString()

if (before !== after) {
  throw new Error('before doesn\'t match after')
} else {
  console.log('Passed')
}
