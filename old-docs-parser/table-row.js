module.exports = {
  event (row) {
    const match = row.match(/\|\s*`@([:\w-_]+)\(?([\w-_, ]*)\)?`\s*\|\s*([0-9\w-_ (),.]*)\|/)
    if (match) {
      return {
        element: 'event',
        name: match[1].trim(),
        params: match[2].split(',').map(param => param.trim()).filter(p => p),
        desc: match[3].trim()
      }
    }
  },
  method (row) {
    const match = row.match(/\|\s*`([\w-_]+)\(([\w-_, ]*)\)`\s*\|\s*([0-9\w-_ (),.]*)\|/)
    if (match) {
      return {
        element: 'method',
        name: match[1].trim(),
        params: match[2].split(',').map(param => param.trim()).filter(p => p),
        desc: match[3].trim()
      }
    }
  },
  prop (row) {
    const parts = row.split('|')
      .map(part => part.trim())
      .filter(part => part)

    if (parts.length === 3 && parts[0].startsWith('`') && parts[0].endsWith('`')) {

      return {
        element: 'prop',
        name: parts[0].substring(1, parts[0].length - 1),
        type: parts[1].split(',').map(param => param.trim()).filter(p => p),
        desc: parts[2]
      }
    }
  },
  modifier (row) {},
  class (row) {},
  injection (row) {}
}
