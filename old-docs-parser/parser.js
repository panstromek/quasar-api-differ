const { parseTable } = require('./table')
const { matchTag } = require('./tag-matcher')
const { parseDocsFile } = require('./file')

module.exports = {
  parseFilesToMetaTables (metaFiles, veturTags) {
    return metaFiles
      .map(({ filename, file }) => parseDocsFile(file, filename))
      .flat(1)
      .map(tableData => ({
        ...tableData,
        table: parseTable(tableData)
      }))
      .filter(tableData => tableData.table.length) // filter empty (unparsed) tables
      .map(tableData => matchTag(tableData, veturTags, console.log))
  }
}
