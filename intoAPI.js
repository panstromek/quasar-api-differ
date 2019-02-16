const fs = require('fs')
const _ = require('lodash')
const { parseTable } = require('./old-docs-parser/table')

const { matchTag } = require('./old-docs-parser/tag-matcher')
const kebabToPascal = require('./utils/casing').kebabToPascal
const { parseVeturTags } = require('./old-docs-parser/vetur')
const { intoTableMetaObjects } = require('./old-docs-parser/file')

const tags = parseVeturTags(require('./node_modules/quasar-framework/dist/helper-json/quasar-tags'))

const mdPath = 'node_modules/quasar-old-docs/source/components'
const oldFileNames = fs.readdirSync(mdPath)

function hasDuplicates (elements, elementName, tagName) {
  const duplicates = Object.values(_.groupBy(elements, el => el.name))
    .filter(els => els.length > 1).flat(1)

  if (duplicates.length > 0) {
    console.log()
    console.log(`duplicate ${elementName}s in table for tag: ${tagName}:`)
    console.log(duplicates.map(dup => `${dup.name} - ${dup.desc}`))
    return true
  }
  return false
}

function getElementsFromTable (element, tableData) {
  const tag = tableData.tags[0]
  const elements = tableData.table.filter(row => row.element === element)
  hasDuplicates(elements, element, tag.pascalName)
  return elements
}

const tables = oldFileNames
  .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))
  .map(({ filename, file }) => intoTableMetaObjects(file, filename))
  .flat(1)
  .map(tableData => ({
    ...tableData,
    table: parseTable(tableData)
  }))
  .filter(tableData => tableData.table.length) // filter empty (unparsed) tables
  .map(tableData => matchTag(tableData, tags, console.log))

const unmatchedTables =
  tables
    .filter(tableData => tableData.tags.length === 0) /// TODO try to lookup missing tags/attrs in unmatched tables (works only for props) (icon)

const singeMatchedTables = tables.filter(tableData => tableData.tags.length === 1)

const apis = singeMatchedTables.map(tableData => {
  const tag = tableData.tags[0]
  const events = getElementsFromTable('event', tableData)
  const props = getElementsFromTable('prop', tableData)
  const methods = getElementsFromTable('method', tableData)
  if ([events, props, methods].filter(a => a.length).length !== 1) {
    console.log(tag + ' has mixed table')
  }
  return {
    tag,
    events,
    props,
    methods
  }
})

let fullAPIs = Object
  .entries(_.groupBy(apis, api => api.tag.name))
  .map(([tag, apis]) => {
    const events = apis.map(api => api.events).flat(1)
    const props = apis.map(api => api.props).flat(1)
    const methods = apis.map(api => api.methods).flat(1)
    const hasDuplicates2 = (hasDuplicates(events, 'event', tag) ||
      hasDuplicates(props, 'prop', tag) ||
      hasDuplicates(methods, 'method', tag))
    return { tag, events, props, methods, hasDuplicates: hasDuplicates2 }
  })
const nonProblematic =
  fullAPIs
    .filter(({ hasDuplicates }) => !hasDuplicates)

const problematic =
  fullAPIs
    .filter(({ hasDuplicates }) => hasDuplicates)

console.log('Non problematic:')
console.log(nonProblematic.map(t => t.tag))

console.log()
console.log()
console.log('Unmatched Tables:')
console.log(unmatchedTables.map(tableData => tableData.filename + ' --- ' + tableData.headers[tableData.headers.length - 1]))
console.log()
console.log('MultiMatched Tables:')
console.log(tables
  .filter(tableData => tableData.tags.length > 1)
  .map(tableData => tableData.filename + ' --- ' + tableData.headers[tableData.headers.length - 1]))

console.log('Has duplicates:')
console.log(problematic.map(t => t.tag))

if (!fs.existsSync('.json-api')) {
  fs.mkdirSync('.json-api')
}

function write (tag, api) {
  fs.writeFileSync(`.json-api/${kebabToPascal(`q-${tag}`)}.json`, JSON.stringify(api))
}

function paramsToJSON (params) {
  return params.reduce((jsonParams, param) => ({ ...jsonParams, [param]: {} }), {})
}

nonProblematic.forEach(({ tag, events, props, methods }) => {
  const jsonAPI = {
    type: 'component'
  }
  if (events.length) {
    jsonAPI.events = events.reduce((jsonEvents, { name, desc, params }) => ({
      ...jsonEvents,
      [name]: { desc, params: paramsToJSON(params) }
    }), {})
  }
  if (props.length) {
    jsonAPI.props = {}
    props.forEach(({ name, type, desc }) => {
      jsonAPI.props[name] = {
        type: intoJSONAPIType(type),
        desc
      }
    })
  }
  if (methods.length) {
    jsonAPI.methods = {}
    methods.forEach(({ name, params, desc }) => {
      jsonAPI.methods[name] = {
        params: paramsToJSON(params),
        desc
      }
    })
  }

  write(tag, jsonAPI)
})

function intoJSONAPIType (type) {
  if (type.length === 1) {
    return type[0]
  }
  return type
}
