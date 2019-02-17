const _ = require('lodash')

module.exports = {
  mergeApis (target, source) {
    return _.mergeWith(
      target, source, function (targetVal, sourceVal) {
        if (Array.isArray(targetVal)) {
          if (Array.isArray(sourceVal)) {
            return _.uniq([...targetVal, ...sourceVal])
          }
          return sourceVal
        }
      })
  }
}
