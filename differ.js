const fs = require('fs')

const oldTags = require('./node_modules/quasar-framework/dist/helper-json/quasar-tags')
const newTags = require('./node_modules/quasar/dist/vetur/quasar-tags')
const oldAttrs = require('./node_modules/quasar-framework/dist/helper-json/quasar-attributes')
const newAttrs = require('./node_modules/quasar/dist/vetur/quasar-attributes')

const diff = '# Quasar props diff\n' +
  Object.entries(oldTags)
    .map(([tag, { attributes }]) => {
      // tag = renamed[tag] || tag
      if (!newTags[tag]) {
        return `## ${tag} - removed` + '\n' + attributes.map(attr => ` - ${attr}`).join('\n')
      }

      const attrs = attributes.map(attr => {
        const attrRef = `${tag}/${attr}`
        if (!newTags[tag].attributes.some(at => at === attr)) {
          return ` - Attribute \`${attr}\` was removed.`
        }

        const oldType = (oldAttrs[attrRef] && oldAttrs[attrRef].type) || 'Any'
        const newType = (newAttrs[attrRef] && newAttrs[attrRef].type) || 'Any'
        if (oldType !== newType) {
          return ` - Type of \`${attr}\` was changed from \`${oldType}\` to \`${newType}\``
        }
        return ``
      }).filter(val => val).join('\n')
      if (!attrs) {
        return ''
      }
      return `## ${tag}` + '\n' + `${attrs}`
    }).filter(val => val).join('\n')

fs.writeFileSync('diff.md', diff)
