const fs = require('fs')
const _ = require('lodash')

const { intoJSONAPI } = require('./old-docs-parser/vetur')

let newApiDir = './node_modules/quasar/dist/api'

const oldTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const oldAttrs = require('./node_modules/quasar-framework/dist/helper-json/quasar-attributes')
const { generateMarkdownDiff } = require('./diff-generator')

const veturAPIs = intoJSONAPI(oldTags, oldAttrs)

const target = 'api-diff.md'

const replacementsJson = require('./v1-replacements.json')

const replacedNotes = _.fromPairs(replacementsJson.map(arr => arr.slice(0, 2)))
const replacementComponents = _.fromPairs(replacementsJson.map(arr => [arr[0], arr[2]]))

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
    .map(name => ({ newApi: require(`${newApiDir}/${name}.json`), name }))
    .filter(({ name }) => !veturAPIs[name])
    .filter(api => api.newApi.type === 'component')
    .concat(oldAPIs.sort()
      .map(filename => {
        const replacement = replacementComponents[desuffix(filename)]
        return {
          oldApi: load(filename),
          newApi: fs.existsSync(`${newApiDir}/${filename}`) && require(`${newApiDir}/${filename}`),
          name: desuffix(filename),
          replacement: replacement && require(`${newApiDir}/${replacement}.json`)
        }
      }))

const diffHeader = `
# Quasar API Diff

Changelist between 0.17.19 and 1.0.0-beta.2 - additions, removals and changes in component APIs

> **WARNING**
> This file is generated automatically from old docs, vetur helpers and some hardcoded rules - information may be incorrect, so take it with a grain of salt.

If you find problem, report it please, but keep in mind that it's not possible to generate this 100% correct automatically. It's meant to be just a tool for quick lookup of what you might need to focus on when migrating.

> Few known problems 
>  - \`v-model\` is not recognized in old docs, so there are few "false new" \`value\` props.
>  - events/methods for some components may be missing
>  - some undocumented features may be missing (obviously)
`

const mdDiff = `${diffHeader}

${generateMarkdownDiff(allAPIs, replacedNotes).replace(/(\n\n)/g, '\n')}`

fs.writeFileSync(target, mdDiff)

module.exports = function () {}
