module.exports = {
  arraySetEq,
  arrayEq,
  keySetEq,
  keyEqOrd
}

function keySetEq (o1 = {}, o2 = {}) {
  return arraySetEq(Object.keys(o1), Object.keys(o2))
}

function arrayEq (arr, arr2) {
  return arr.length === arr2.length && arr.filter((val, i) => arr2[i] === val).length === arr2.length
}

function arraySetEq (oldVal, newVal) {
  return oldVal.length === newVal.length && oldVal.filter(val => newVal.includes(val)).length === newVal.length
}

function keyEqOrd (o1 = {}, o2 = {}) {
  return arrayEq(Object.keys(o1), Object.keys(o2))
}
