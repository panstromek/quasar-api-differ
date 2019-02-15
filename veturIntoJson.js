const fs = require('fs')
const _ = require('lodash')

const oldTags = require('./old/quasar-tags')
const newTags = require('./new/quasar-tags')
const oldAttrs = require('./old/quasar-attributes')
const newAttrs = require('./new/quasar-attributes')
const { intoJSONAPI } = require('./old-docs-parser/vetur')

fs.writeFileSync('fromVetur.json', JSON.stringify(intoJSONAPI(oldTags, oldAttrs)))
