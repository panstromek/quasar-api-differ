const { mergeDuplicatesByName } = require('./table')
const { parseTable } = require('./table')
const { matchTag } = require('./tag-matcher')
const { parseDocsFile } = require('./file')
const _ = require('lodash')
const { intoJSONAPI } = require('./vetur')
const { mergeApis } = require('../utils/mergeAPIs')
const { kebabToPascal } = require('../utils/casing')

const { intoJSON } = require('./into-json')
const { parseVeturTags } = require('./vetur')

const me = module.exports = {

  createJSONAPI (oldAttrs, metaFiles, oldTags) {
    const finalAPIS = { ...intoJSONAPI(oldTags, oldAttrs) }

    me.parse(metaFiles, oldTags)
      .map(({ tag, api }) => {
        const name = kebabToPascal(`q-${tag}`)
        const veturApi = finalAPIS[name] || {}
        finalAPIS[name] = mergeApis(veturApi, api)
      })
    return finalAPIS
  },

  parse (metaFiles, veturTags) {
    return intoJSON(me.deduplicateAllApis(me.parseFilesToMetaTables(metaFiles, parseVeturTags(veturTags))
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
      })))
  },

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
      .entries(_.groupBy(singeMatchAPIs, api => api.tag.name))
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
