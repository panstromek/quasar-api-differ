const fs = require('fs')
const _ = require('lodash')

const { intoJSONAPI } = require('./old-docs-parser/vetur')

let newApiDir = './node_modules/quasar/dist/api'

const oldTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const oldAttrs = require('./node_modules/quasar-framework/dist/helper-json/quasar-attributes')
const { generateMarkdownDiff } = require('./diff-generator')

const veturAPIs = intoJSONAPI(oldTags, oldAttrs)

const target = 'api-diff.md'

const replacements = _.fromPairs(require('./v1-replacements.json'))

function desuffix (filename) {
  return filename.substring(0, filename.length - 5)
}

function load (filename) {
  return JSON.parse(fs.readFileSync(`./.json-api/${filename}`).toString())
}

const oldAPIs = fs.readdirSync('./.json-api')

const allAPIs =
  fs.readdirSync(`${newApiDir}`)
    .map(desuffix)
    .filter(name => !veturAPIs[name])
    .map(name => ({ newApi: require(`${newApiDir}/${name}.json`), name }))
    .filter(api => api.newApi.type === 'component')
    .concat(oldAPIs.sort()
      .map(filename => {
        return {
          oldApi: load(filename),
          newApi: fs.existsSync(`${newApiDir}/${filename}`) && require(`${newApiDir}/${filename}`),
          name: desuffix(filename)
        }
      }))

const diffHeader = `# Quasar API XOR (old XOR new)
This is generated - information may be incorrect.
If you find problem, report it please.`

const mdDiff = `${diffHeader}

${generateMarkdownDiff(allAPIs, replacements)}`

fs.writeFileSync(target, mdDiff)

module.exports = function () {}
