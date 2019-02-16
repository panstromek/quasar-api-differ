const _ = require('lodash')

console.log(_.mergeWith({
  type: {
    subt: ['koko', 'moko', 'loko']
  }
}, {
  type: {
    subt: ['soso']
  }
}, function (oldVal, newVal) {
  if (Array.isArray(oldVal)) {
    return newVal
  }
}))
