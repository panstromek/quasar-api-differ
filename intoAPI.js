const fs = require('fs')
const ignoredFiles = ['introduction-for-beginners']
const oldTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const oldAttrs = require('./node_modules/quasar-framework/dist/helper-json/quasar-attributes')
const { createJSONAPI } = require('./old-docs-parser/parser')
const mdPath = 'node_modules/quasar-old-docs/source/components'

const metaFiles = fs.readdirSync(mdPath)
  .filter(filename => !ignoredFiles.some(ignored => filename.includes(ignored)))
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}

const finalAPIS = createJSONAPI(oldTags, oldAttrs, metaFiles)

Object.entries(finalAPIS)
  .map(([name, veturApi]) => {
    fs.writeFileSync(`.json-api/${(name)}.json`, JSON.stringify(veturApi))
  })
