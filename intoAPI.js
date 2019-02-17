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

const metaFiles = fs.readdirSync(mdPath)
  .filter(filename => !ignoredFiles.some(ignored => filename.includes(ignored)))
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}

const finalAPIS = { ...intoJSONAPI(oldTags, oldAttrs) }

parse(metaFiles, veturTags)
  .map(({ tag, api }) => {
    const name = kebabToPascal(`q-${tag}`)
    const veturApi = finalAPIS[name] || {}
    finalAPIS[name] = mergeApis(veturApi, api)
  })

Object.entries(finalAPIS)
  .map(([name, veturApi]) => {
    fs.writeFileSync(`.json-api/${(name)}.json`, JSON.stringify(veturApi))
  })
