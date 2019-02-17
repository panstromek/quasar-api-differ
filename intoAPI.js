const fs = require('fs')
const { kebabToPascal } = require('./utils/casing')

const veturTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const { parse } = require('./old-docs-parser/parser')
const ignoredFiles = ['introduction-for-beginners']

const mdPath = 'node_modules/quasar-old-docs/source/components'

function write (tag, api) {
  fs.writeFileSync(`.json-api/${kebabToPascal(`q-${tag}`)}.json`, JSON.stringify(api))
}

function notIgnored (filename) {
  return !ignoredFiles.some(i => filename.includes(i))
}

const metaFiles = fs.readdirSync(mdPath)
  .filter(notIgnored)
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}

parse(metaFiles, veturTags).map(({ tag, api }) => write(tag, api))
