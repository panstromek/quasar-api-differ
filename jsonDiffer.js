const fs = require('fs')
const _ = require('lodash')

const { intoJSONAPI } = require('./old-docs-parser/vetur')

let newApiDir = './node_modules/quasar/dist/api'

const oldTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const oldAttrs = require('./node_modules/quasar-framework/dist/helper-json/quasar-attributes')
const { diffMethods } = require('./diff-generator')
const { diffEvents } = require('./diff-generator')
const { diffProps } = require('./diff-generator')

const veturAPIs = intoJSONAPI(oldTags, oldAttrs)

const target = 'api-diff.md'

const replacements = _.fromPairs(require('./v1-replacements.json'))

fs.writeFileSync(target, `# Quasar API XOR (old XOR new)
This is generated - information may be incorrect.
If you find problem, report it please.

`)

function write (data) {
  fs.appendFileSync(target, data)
}

function desuffix (filename) {
  return filename.substring(0, filename.length - 5)
}

const newComponentApis = fs.readdirSync(`${newApiDir}`)
  .map(desuffix)
  .filter(name => !veturAPIs[name])
  .map(name => ({ newApi: require(`${newApiDir}/${name}.json`), name }))
  .filter(api => api.newApi.type === 'component')

function load (filename) {
  return JSON.parse(fs.readFileSync(`./.json-api/${filename}`).toString())
}

newComponentApis
  .concat(fs.readdirSync('./.json-api').sort()
    .map(filename => {
      return {
        oldApi: load(filename),
        newApi: fs.existsSync(`${newApiDir}/${filename}`) && require(`${newApiDir}/${filename}`),
        name: desuffix(filename)
      }
    }))

  .forEach(({ oldApi, newApi, name }) => {
    if (!newApi) {
      return write(`## ${name}  - removed\n   - ${replacements[name]}\n`)
    }
    if (oldApi) {
      write(`\n## ${name}\n`)
    } else {
      write(`\n## ${name} - **NEW**\n`)
      oldApi = {}
    }

    const propDiff = diffProps(oldApi.props, newApi.props).trimRight()
    if (propDiff) {
      write(`#### Props\n` + propDiff + '\n')
    }
    const eventDiff = diffEvents(oldApi.events, newApi.events).trimRight()
    if (eventDiff) {
      write(`#### Events\n` + eventDiff + '\n')
    }
    const methodDiff = diffMethods(oldApi.methods, newApi.methods).trimRight()
    if (methodDiff) {
      write(`#### Methods\n` + methodDiff + '\n')
    }
  })

module.exports = function () {}
