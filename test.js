const _ = require('lodash')

// console.log(_.mergeWith({
//   type: {
//     subt: ['koko', 'moko', 'loko']
//   }
// }, {
//   type: {
//     subt: ['soso']
//   }
// }, function (oldVal, newVal) {
//   if (Array.isArray(oldVal)) {
//     return newVal
//   }
// }))


Array.prototype._ = function (fn) {
  return (...args) => fn(this, ...args)
}

const koko = [1, 2, 3, 4, 5, 6]

const mapped = koko._(_.countBy)(val => val * 2)

console.log(mapped)

_.wrap(koko).countBy()
