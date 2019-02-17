const rowParsers = require('./table-row')
const _ = require('lodash')
const tableDataTypes = ['event', 'method', 'prop', 'modifier', 'class', 'injection']

function mergeRows (rows) {
  return rows.reduce((acc, row) => _.mergeWith(acc, row, (target, source) => {
    if (Array.isArray(target)) {
      return _.uniq([...target, ...source])
    }
    if (typeof target === 'string') {
      if (target === source) {
        return source
      }
      return target + '|' + source
    }
  }), {})
}

const me = module.exports = {
  mergeRows,
  mergeDuplicatesByName (table, headers) {
    return Object.entries(_.groupBy(table, r => r.name))
      .map(([name, rows]) => {
        if (rows.length > 1) {
          console.log(`Merging duplicate row ${name} in the same table: ${headers}`)
          console.log(`    -  ${rows.map(row => row.name + ' ' + row.desc)}`)
          return mergeRows(rows)
        }
        return rows[0]
      })
  },
  parseTable ({ rows, headers }) {
    let tableHeader = rows[0].toLowerCase()
    let lastHeading = (headers[headers.length - 1] || '').toLowerCase()

    const typeCandidates = tableDataTypes.filter(type => tableHeader.includes(type) || lastHeading.includes(type))
    const parsedRows = rows.map(row => {
      let parsedRows = typeCandidates.map(type => rowParsers[type](row)).filter(row => row)
      if (parsedRows.length > 1) {
        // TODO should I throw here or what?
        console.log('multiple  parsers parsed row: ' + row)
        throw new Error('multiple  parsers parsed row: ' + row)
      }
      return parsedRows
    }).flat(1).filter(p => p)

    if (Object.keys(_.groupBy(parsedRows, row => row.element)).length > 1) {
      console.log()
      console.log('Mixed table:')
      console.log(headers)
      console.log(rows)
      console.log('Types: ' + Object.keys(_.groupBy(parsedRows, row => row.element)))
      throw new Error('mixed table - multiple types in one table')
    }

    return me.mergeDuplicatesByName(parsedRows, headers)
  }
}
