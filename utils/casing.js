module.exports = {
  toKebab (word) {
    return word.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase()
  },
  kebabToPascal (word) {
    return ('-' + word).replace(/-(\w)/g, (_, c) => c.toUpperCase())
  },
}
