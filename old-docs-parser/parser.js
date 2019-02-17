import { groupBy } from 'lodash'

const { mergeDuplicatesByName } = require('./table')
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
  },

  deduplicateAllApis (singeMatchAPIs) {
    return Object
      .entries(groupBy(singeMatchAPIs, api => api.tag.name))
      .map(([tag, apis]) => {
        return {
          tag,
          events: mergeDuplicatesByName(apis.map(api => api.events).flat(1)),
          props: mergeDuplicatesByName(apis.map(api => api.props).flat(1)),
          methods: mergeDuplicatesByName(apis.map(api => api.methods).flat(1))
        }
      })
  }
}
