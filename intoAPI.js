const fs = require('fs')
const { kebabToPascal } = require('./utils/casing')

const veturTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const { parse } = require('./old-docs-parser/parser')
const ignoredFiles = ['introduction-for-beginners']

const mdPath = 'node_modules/quasar-old-docs/source/components'

const metaFiles = fs.readdirSync(mdPath)
  .filter(filename => !ignoredFiles.some(ignored => filename.includes(ignored)))
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}

parse(metaFiles, veturTags)
  .map(({ tag, api }) =>
    fs.writeFileSync(`.json-api/${kebabToPascal(`q-${tag}`)}.json`, JSON.stringify(api)))
