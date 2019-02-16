const fs = require('fs')
const _ = require('lodash')

const oldTags = require('./old/quasar-tags')
const newTags = require('./new/quasar-tags')
const oldAttrs = require('./old/quasar-attributes')
const newAttrs = require('./new/quasar-attributes')
const { intoJSONAPI } = require('./old-docs-parser/vetur')

const veturAPI = intoJSONAPI(oldTags, oldAttrs)

fs.writeFileSync('fromVetur.json', JSON.stringify(veturAPI))

let oldApiDir = './.json-api'

fs.readdirSync(oldApiDir)
  .map(filename => {
    const oldApi = require(`./.json-api/${filename}`)
    fs.writeFileSync('merged-' + filename,
      JSON.stringify(_.mergeWith(veturAPI[filename.substring(0, filename.length - 5)], oldApi,
        function (oldVal, newVal) {
          if (Array.isArray(oldVal)) {
            return newVal
          }
        })))

  })
