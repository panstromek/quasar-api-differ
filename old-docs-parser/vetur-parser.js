const { kebabToPascal } = require('../utils/casing')
module.exports = {
  parseVeturTags (veturTags) {
    return Object.entries(veturTags)
      .map(([tag, attributes]) => ({
        tag,
        name: tag.substring(2),
        pascalName: kebabToPascal(tag),
        attributes
      }))
  }
}
