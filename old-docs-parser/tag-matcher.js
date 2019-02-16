const { parseInstallationSection } = require('./file')

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
      log(filename + ' - nothing in installation part for ' + (table.map(row => row.name)))
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
      log()
      log(filename + ' - nothing in header for ' + (table.map(row => row.name)))
      return tableData
    }
    log()
    log(`${filename} -  multiple tags for header (${lastHeader}) - ${tagsInHeader.map(t => t.pascalName)}`)
    if (tagsInHeader.length) {
      tableData.tags.push(...tagsInHeader)
      return tableData
    }
    return tableData
  }
}
