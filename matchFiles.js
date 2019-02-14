const fs = require('fs')

const mdPath = 'node_modules/quasar-old-docs/source/components'
const oldFileNames = fs.readdirSync(mdPath)

function getMatchingFiles (string) {
  return oldFileNames.filter(
    file => {
      return file.includes(string) || string.includes(file.substring(0, file.length - 3))
    })
}

function toKebab (i) {
  return i.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase()
}

function toCamel (i) {
  return ('-' + i).replace(/-([a-z])/g, c => c[1].toUpperCase())
}

const oldTags = require('./old/quasar-tags')

const matches = Object.entries(oldTags)
  .map(([tag, { attributes }]) => {
    let rawTag = (tag.startsWith('q-') ? tag.substring(2) : tag)
    let filename = rawTag + '.md'

    const files = []

    if (fs.existsSync(`${mdPath}/${filename}`)) {
      files.push(filename)
    }
    filename = filename.replace(/btn/g, 'button')

    if (fs.existsSync(`${mdPath}/${filename}`)) {
      files.push(filename)
    }
    files.push(...getMatchingFiles(rawTag))

    files.push(
      ...rawTag.split('-')
        .map(part => getMatchingFiles(part))
        .flat(1))
    files.push(...oldFileNames)

    return {
      tag, attributes,
      files: files.filter((file, i) => files.indexOf(file) === i)
    }
  })

const matchMap = {}

const resolved = matches.map(({ tag, files, attributes }) => {
  const camelTag = toCamel(tag)
  let candidates = files
    .map(filename => ({
      filename,
      file: fs.readFileSync(`${mdPath}/${filename}`).toString()
    }))
    .filter(({ file }) => file.includes(camelTag))
    .filter(({ file }) => file.includes(tag))

  for (let i = 0; candidates.length > 1 && i < attributes.length; i++) {
    candidates = candidates.filter(({ file }) => file.includes(`\`${attributes[i]}\``))
  }

  if (candidates.length > 1) {
    console.log(camelTag + ' matches ' + candidates.map(c => c.filename))
  }
  candidates.forEach(({ filename }) => {
    matchMap[filename] = matchMap[filename] ? [...matchMap[filename], tag] : [tag]
  })
  return { tag, candidates, attributes, camelTag }
})

const tables = resolved.map(({ tag, candidates, attributes, camelTag }) => {
  return candidates.map(({ file, filename }) => {
    const otherPossibleTags = matchMap[filename]

    let lastKnownComponent = camelTag
    let tables = []
    let currentTable = {}
    file.split('\n')
      .map(row => row.trim())
      .filter(row => row.startsWith('#') || row.startsWith('|'))
      .forEach(row => {
        if (row.startsWith('#')) {

          const possibleComponents = otherPossibleTags
            .filter(tag => (row + ' ').match(new RegExp(`[^a-zA-Z]${toCamel(tag)}[^a-zA-Z]`, 'g')))

          if (possibleComponents.length > 1) {
            console.log(`too many possible components for a header ${row} - ${possibleComponents}`)
            lastKnownComponent = possibleComponents
          } else if (possibleComponents.length === 1) {
            lastKnownComponent = toCamel(possibleComponents[1])
          } else if (row.includes(camelTag)) {
            lastKnownComponent = camelTag
          }
          currentTable = { header: row, table: [], component: lastKnownComponent }
          tables.push(currentTable)
        } else {
          currentTable.table.push(row)
        }
      })

    return tables.filter(table => table.table.length > 0)

  }).flat(1)

})
  .flat(1)
  .map(table => {
    if (!Array.isArray(table.component)) {
      return table
    }
    return table.component.map(component => ({
      ...table,
      component
    }))

  }).flat(1)
