const fs = require('fs')
const _ = require('lodash')

function toCamel (i) {
  return ('-' + i).replace(/-([a-z])/g, c => c[1].toUpperCase())
}

const parsers = {
  event (row) {
    const match = row.match(/\|\s*`@([:\w-_]+)\(?([\w-_, ]*)\)?`\s*\|\s*([0-9\w-_ (),.]*)\|/)
    if (match) {
      return {
        element: 'event',
        name: match[1].trim(),
        params: match[2].split(',').map(param => param.trim()).filter(p => p),
        desc: match[3].trim()
      }
    }
  },
  method (row) {
    const match = row.match(/\|\s*`([\w-_]+)\(([\w-_, ]*)\)`\s*\|\s*([0-9\w-_ (),.]*)\|/)
    if (match) {
      return {
        element: 'method',
        name: match[1].trim(),
        params: match[2].split(',').map(param => param.trim()).filter(p => p),
        desc: match[3].trim()
      }
    }
  },
  prop (row) {
    const parts = row.split('|')
      .map(part => part.trim())
      .filter(part => part)

    if (parts.length === 3 && parts[0].startsWith('`') && parts[0].endsWith('`')) {

      return {
        element: 'prop',
        name: parts[0].substring(1, parts[0].length - 1),
        type: parts[1].split(',').map(param => param.trim()).filter(p => p),
        desc: parts[2]
      }
    }
  },
  modifier (row) {},
  class (row) {},
  injection (row) {}
}

function getAllTablesFromTheFile (filename) {

  const file = fs.readFileSync(`${mdPath}/${filename}`)
    .toString()

  const tables = [{
    headers: [],
    rows: [],
    file,
    filename
  }]

  file
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('#') || line.startsWith('|'))
    .forEach(line => {
      if (line.startsWith('#')) {
        if (tables[0].rows.length) {
          tables.unshift({
            headers: [line],
            rows: [],
            file,
            filename
          })
        } else {
          tables[0].headers.push(line)
        }
      } else if (line.startsWith('|')) {
        tables[0].rows.push(line)
      }
    })
  return tables.filter(table => table.rows.length > 0)
}

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
      const parser = parsers[type]
      return parser(row)
    }).filter(row => row)
    if (parsedRows.length > 1) {
      console.log('more parsers parsed row + ' + parsedRows)
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

const tags = Object.entries(require('./old/quasar-tags')).map(([tag, attributes]) => {
  return {
    tag,
    name: tag.substring(2),
    camelName: toCamel(tag),
    attributes
  }
})

const mdPath = 'node_modules/quasar-old-docs/source/components'
const oldFileNames = fs.readdirSync(mdPath)

function matchComponent (tableData) {
  const { rows, filename, headers, table, file } = tableData
  tableData.tags = []

  // let tagsMatchingFilenames = tags.filter(tag => filename === (tag.name.replace(/btn/g, 'button') + '.md'))
  // if (tagsMatchingFilenames.length === 1) {
  //   tableData.tags.push(tagsMatchingFilenames[0])
  //   return tableData
  // }

  const installationPart = parseInstallationPart(file)
  const tagsInInstallationPart = tags.filter(tag => {
    return installationPart.includes(`'${tag.camelName}'`)
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
    return lastHeaderWords.includes(tag.camelName)
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
  console.log(`${filename} -  multiple tags for header (${lastHeader}) - ${tagsInHeader.map(t => t.camelName)}`)
  if (tagsInHeader.length) {
    tableData.tags.push(...tagsInHeader)
    return tableData
  }

  return tableData
}

function parseInstallationPart (file) {
  return file.split('\n#')
    .filter(part => part.toLowerCase().includes('install'))
    .filter(part => part.includes('```js'))
    .map(part => part.trim())
    .join(' ')
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
  hasDuplicates(elements, element, tag.camelName)
  return elements
}

const tables = oldFileNames
  .map(filename => getAllTablesFromTheFile(filename))
  .flat(1)
  .map(tableData => parseTable(tableData))
  .filter(tableData => tableData.table.length) // filter empty (unparsed) tables
  .map(matchComponent)

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
