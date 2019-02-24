const fs = require('fs')
const { parseInstallationSection } = require('./old-docs-parser/file')

const mdPath = 'node_modules/quasar-old-docs/source/components'
fs.writeFileSync('old-slots.md',
  fs.readdirSync(mdPath)
    .map(filename => ({ filename, file: fs.readFileSync(`${mdPath}/${filename}`).toString() }))
    .filter(({ file }) => file.includes('slot'))
    .map(({ filename, file }) => {
      console.log(filename)
      return `
${filename}
|Legacy|v1|
|-|-|
${file
    .split('\n')
    .filter(line => line.includes('slot="'))
    .map(line => line.split('slot="')[1].split(`"`)[0])
    .filter((slotName, i, arr) => arr.lastIndexOf(slotName) === i)
    .sort()
    .map(slot => `|\`${slot}\`||`)
    .join('\n')}
`
    }).join('\n'))
