const fs = require('fs')
const _ = require('lodash')

const rowParsers = require('./old-docs-parser/table-row')
const { parseVeturTags } = require('./old-docs-parser/vetur')
const { parseInstallationSection } = require('./old-docs-parser/file')
const { intoTableMetaObjects } = require('./old-docs-parser/file')

function parseTable ({ rows, filename, headers, file }) {
  let tableHeader = rows[0].toLowerCase()
  let lastHeader = (headers[headers.length - 1] || '').toLowerCase()

  const typeCandidates = ['event', 'method', 'prop', 'modifier', 'class', 'injection']
    .filter(type => tableHeader.includes(type) || lastHeader.includes(type))

//   if (typeCandidates.length === 0) {
//     console.log(`
// Missing parser for table in ${filename}
// ${[lastHeader, tableHeader].join('\n')}
//     `)
//   } else if (typeCandidates.length > 1) {
//     console.log(`
// Multiple parsers ${typeCandidates} for table in ${filename}
// ${[lastHeader, tableHeader].join('\n')}
//     `)
//   }
  const table = rows.map(row => {
    let parsedRows = typeCandidates.map(type => {
      const parser = rowParsers[type]
      return parser(row)
    }).filter(row => row)
    if (parsedRows.length > 1) {
      console.log('more parsers parsed row + ' + row)
    }
    return parsedRows
  }).flat(1).filter(p => p)

  return {
    rows,
    filename,
    headers,
    table,
    file
  }
}

const tags = parseVeturTags(require('./old/quasar-tags'))

const mdPath = 'node_modules/quasar-old-docs/source/components'
const oldFileNames = fs.readdirSync(mdPath)

/**
 *
 * @param tableData
 * @param tags
 * @return {{headers: Array, file: *, filename: *, rows: Array, tags: Array }[]}
 */
function matchComponent (tableData, tags) {
  const { filename, headers, table, file } = tableData
  tableData.tags = []

  // let tagsMatchingFilenames = tags.filter(tag => filename === (tag.name.replace(/btn/g, 'button') + '.md'))
  // if (tagsMatchingFilenames.length === 1) {
  //   tableData.tags.push(tagsMatchingFilenames[0])
  //   return tableData
  // }

  const installationPart = parseInstallationSection(file)
  const tagsInInstallationPart = tags.filter(tag => {
    return installationPart.includes(`'${tag.pascalName}'`)
  })
  if (tagsInInstallationPart.length === 1) {
    tableData.tags.push(tagsInInstallationPart[0])
    return tableData
  }
  if (tagsInInstallationPart.length === 0) {
    console.log()
    console.log(filename + ' - nothing in installation part for ' + (table.map(row => row.name)))
    return tableData
  }

  let lastHeader = headers[headers.length - 1]
  const lastHeaderWords = lastHeader.replace(/\W/g, ' ').split(' ').map(word => word.trim()).filter(w => w)
  const tagsInHeader = tagsInInstallationPart.filter(tag => {
    return lastHeaderWords.includes(tag.pascalName)
  })
  if (tagsInHeader.length === 1) {
    tableData.tags.push(tagsInHeader[0])
    return tableData
  }
  if (tagsInHeader.length === 0) {
    console.log()
    console.log(filename + ' - nothing in header for ' + (table.map(row => row.name)))
    return tableData
  }
  console.log()
  console.log(`${filename} -  multiple tags for header (${lastHeader}) - ${tagsInHeader.map(t => t.pascalName)}`)
  if (tagsInHeader.length) {
    tableData.tags.push(...tagsInHeader)
    return tableData
  }

  return tableData
}

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
  .map(tableData => parseTable(tableData))
  .filter(tableData => tableData.table.length) // filter empty (unparsed) tables
  .map(tableData => matchComponent(tableData, tags))

const unmatchedTables =
  tables
    .filter(tableData => tableData.tags.length === 0) /// TODO try to lookup missing tags/attrs in unmatched tables (works only for props) (icon)

//
// tags.map(tag => {
//   const events = getElementsFromTable('event', tag)
//   const props = getElementsFromTable('prop', tag)
//   const methods = getElementsFromTable('method', tag)
// })

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
    methods,
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
