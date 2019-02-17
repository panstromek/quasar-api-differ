const fs = require('fs')
const { kebabToPascal } = require('./utils/casing')

const veturTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const { mergeApis } = require('./utils/mergeAPIs')
const { intoJSONAPI } = require('./old-docs-parser/vetur')
const { parse } = require('./old-docs-parser/parser')
const ignoredFiles = ['introduction-for-beginners']
const oldTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const oldAttrs = require('./node_modules/quasar-framework/dist/helper-json/quasar-attributes')
const mdPath = 'node_modules/quasar-old-docs/source/components'
const _ = require('lodash')

const veturAPIs = intoJSONAPI(oldTags, oldAttrs)

const metaFiles = fs.readdirSync(mdPath)
  .filter(filename => !ignoredFiles.some(ignored => filename.includes(ignored)))
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}
function load (filename) {
  return JSON.parse(fs.readFileSync(`./.json-api/${filename}`).toString())
}

const parsed = parse(metaFiles, veturTags)
parsed
  .map(({ tag, api }) => {
    return fs.writeFileSync(`.json-api/${kebabToPascal(`q-${tag}`)}.json`, JSON.stringify(api))
  })

Object.entries(veturAPIs)
  .map(([name, veturApi]) => {
    const filename = name + '.json'

    const oldApi = mergeApis(veturApi,
      fs.existsSync(`./.json-api/${filename}`)
        ? load(filename) : {})
    fs.writeFileSync(`.json-api/${filename}`, JSON.stringify(oldApi))
  })
