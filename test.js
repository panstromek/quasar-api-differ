// https://api.github.com/repos/quasarframework/quasar-framework.org/commits?path=themes/quasar/scripts/page-helpers.js
// https://api.github.com/repos/quasarframework/quasar-framework.org/commits?path=themes/quasar/scripts/page-helpers.js&per_page=1

const fs = require('fs')
const before = fs.existsSync('./api-diff-before.md')
  ? fs.readFileSync('./api-diff-before.md').toString()
  : fs.readFileSync('./api-diff.md').toString()

require('./intoAPI')
require('./jsonDiffer')

const after = fs.readFileSync('./api-diff.md').toString()

if (before === after) {
  console.log('Passed')
  if (fs.existsSync('./api-diff-before.md')) {
    fs.unlinkSync('./api-diff-before.md')
  }
} else {
  fs.writeFileSync('./api-diff-before.md', before)
  throw new Error('before doesn\'t match after')
}
