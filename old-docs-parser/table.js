const rowParsers = require('./table-row')
const _ = require('lodash')
const tableDataTypes = ['event', 'method', 'prop', 'modifier', 'class', 'injection']

module.exports = {
  parseTable ({ rows, headers }) {
    let tableHeader = rows[0].toLowerCase()
    let lastHeading = (headers[headers.length - 1] || '').toLowerCase()

    const typeCandidates = tableDataTypes.filter(type => tableHeader.includes(type) || lastHeading.includes(type))
    // TODO whole table should be parsed - and with a same type
    const parsedRows = rows.map(row => {
      let parsedRows = typeCandidates.map(type => rowParsers[type](row)).filter(row => row)
      if (parsedRows.length > 1) {
        // TODO should I throw here or what?
        console.log('multiple  parsers parsed row: ' + row)
      }
      return parsedRows
    })

    if (Object.keys(_.groupBy(parsedRows, row => row.element)).length !== 1) {
      console.log()
      console.log('Mixed table:')
      console.log(headers)
      console.log(rows)
      console.log()
      throw new Error('mixed table')
    }

    return parsedRows.flat(1).filter(p => p)
  }

}
