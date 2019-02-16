const { kebabToPascal } = require('../utils/casing')
const _ = require('lodash')

function transformProp (veturAttr) {
  if (!veturAttr) {
    return {}
  }
  const type = veturAttr.type.split('|').map(kebabToPascal)
  return {
    type: type.length === 1 ? type[0] : type,
    desc: veturAttr.description
  }
}

module.exports = {
  parseVeturTags (veturTags) {
    return Object.entries(veturTags)
      .map(([tag, attributes]) => ({
        tag,
        name: tag.substring(2),
        pascalName: kebabToPascal(tag),
        attributes
      }))
  },
  intoJSONAPI (veturTags, veturAttrs) {
    return _.fromPairs(Object
      .entries(veturTags)
      .map(([tag, { attributes }]) => {
        return [
          kebabToPascal(tag),
          {
            props: _.fromPairs(attributes.map(attr => ([
              [attr], transformProp(veturAttrs[`${tag}/${attr}`])
            ])))
          }
        ]
      }))
  }
}
