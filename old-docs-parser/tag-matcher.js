const { parseInstallationSection } = require('./file')

function tableType (table = [{}]) {
  return table[0].element
}

module.exports = {
  /**
   *
   * @param tableData
   * @param tags
   * @param log
   * @return {{headers: Array, file: *, filename: *, rows: Array, tags: Array }[]}
   */
  matchTag (tableData, tags, log = (_ => {})) {
    const { filename, headers, table, file } = tableData
    tableData.tags = []

    const matchByAttrs = tags.filter(tag => {
      return tableMatchesAttributes(table, tag.attributes)
    })

    if (matchByAttrs.length === 1) {
      log('matched by attrs for ' + matchByAttrs[0].tag)
      tableData.tags.push(matchByAttrs[0])
      return tableData
    }
    if (tableType(table) === 'prop') {
      tags = matchByAttrs
    }
    const installationPart = parseInstallationSection(file)
    const tagsInInstallationPart = tags.filter(tag => {
      return installationPart.includes(`'${tag.pascalName}'`)
    })
    if (tagsInInstallationPart.length === 1) {
      tableData.tags.push(tagsInInstallationPart[0])
      return tableData
    }
    if (tagsInInstallationPart.length === 0) {
      log()
      log(`UNMATCHED: ${filename} - nothing in installation part for table:`)
      log('   - with headers ' + (headers))
      log('   - with fields ' + (table.map(row => row.name)))
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
    } else if (tagsInHeader.length === 0) {
      log()
      log(`UNMATCHED: ${filename} - nothing in header for table: `)
      log('   - with headers ' + (headers))
      log('   - with fields ' + (table.map(row => row.name)))
      return tableData
    } else {
      log()
      log(`${filename} -  multiple tags for header (${lastHeader}) - ${tagsInHeader.map(t => t.pascalName)} - assigned to both`)
      if (tagsInHeader.length) {
        tableData.tags.push(...tagsInHeader)
        return tableData
      }
      return tableData
    }
  }
}

function tableMatchesAttributes (table, attributes) { // TODO match type, too?
  return (table.filter(row => row.element === 'prop' && attributes.includes(row.name)).length / table.length) > 0.7 // this just an arbitrary chosen precision constant that works
}
