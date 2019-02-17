const fs = require('fs')
const _ = require('lodash')
const { deduplicateAllApis } = require('./old-docs-parser/parser')
const { parseFilesToMetaTables } = require('./old-docs-parser/parser')
const { intoJSON } = require('./old-docs-parser/into-json')
const { kebabToPascal } = require('./utils/casing')
const { parseVeturTags } = require('./old-docs-parser/vetur')

const veturTags = parseVeturTags(require('./node_modules/quasar-framework/dist/helper-json/quasar-tags'))
const ignoredFiles = ['introduction-for-beginners']

const mdPath = 'node_modules/quasar-old-docs/source/components'
const oldFileNames = fs.readdirSync(mdPath)

function write (tag, api) {
  fs.writeFileSync(`.json-api/${kebabToPascal(`q-${tag}`)}.json`, JSON.stringify(api))
}

function notIgnored (filename) {
  return !ignoredFiles.some(i => filename.includes(i))
}

const metaFiles = oldFileNames
  .filter(notIgnored)
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))

const tables = parseFilesToMetaTables(metaFiles, veturTags)

const singeMatchAPIs =
  tables
    .filter(tableData => tableData.tags.length === 1)
    .map(tableData => {
      const {
        event: events = [],
        prop: props = [],
        method: methods = []
      } = _.groupBy(tableData.table, row => row.element)

      return {
        tag: tableData.tags[0],
        events,
        props,
        methods
      }
    })

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}

intoJSON(deduplicateAllApis(singeMatchAPIs)).map(({ tag, api }) => write(tag, api))
