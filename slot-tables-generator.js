const fs = require('fs')

const _ = require('lodash')

let newApiDir = './node_modules/quasar/dist/api'

function desuffix (filename) {
  return filename.substring(0, filename.length - 5)
}

fs.writeFileSync('slot-tables.md',
  fs.readdirSync(`${newApiDir}`)
    .sort()
    .map(desuffix)
    .map(name => ({ api: require(`${newApiDir}/${name}.json`), name }))
    .filter(({ api }) => api.type === 'component')
    .map(({ name, api }) => {
      const slots = { ...api.slots, ...api.scopedSlots }
      if (!slots) {
        return `**${name} Slots**\n\nNo Slots`
      }
      if (Object.keys(slots).length === 1 && slots.default) {
        return
      }
      return `
**${name} Slots**

|Legacy|v1|
|-|-|
${Object.entries(slots).map(([name]) => `||\`${name}\`|`).join('\n')}
`
    }).filter(_ => _).join('\n'))
