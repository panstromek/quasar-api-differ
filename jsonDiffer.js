const fs = require('fs')
const _ = require('lodash')

let newApiDir = './node_modules/quasar/dist/api'
let oldApiDir = './.json-api'
const oldApis = fs.readdirSync(oldApiDir)

const target = 'api-diff.md'
fs.writeFileSync(target, '# Quasar API diff.\n')

function arraySetEq (oldVal, newVal) {
  return oldVal.length === newVal.length && oldVal.filter(val => newVal.includes(val)).length === newVal.length
}

function arrayEq (arr, arr2) {
  return arr.length === arr2.length && arr.filter((val, i) => arr2[i] === val).length === arr2.length
}

function write (data) {
  fs.appendFileSync(target, data)
}

function keySetEq (o1 = {}, o2 = {}) {
  return arraySetEq(Object.keys(o1), Object.keys(o2))
}

function keyEqOrd (o1 = {}, o2 = {}) {
  return arrayEq(Object.keys(o1), Object.keys(o2))
}

function fnFormat (name, params) {
  return `${name}(${Object.keys(params).join(', ')})`
}

function diffEvents (oldEvents, newEvents = {}) {
  return Object.entries(oldEvents).map(([event, api]) => {
    if (!newEvents[event]) {
      return ` - \`@${event}\` was removed\n`
    }
    const newApi = newEvents[event]
    let res = ''
    let desc = ''
    if (api.desc !== newApi.desc) {
      desc += `   - BEFORE: ${api.desc}\n`
      desc += `   - AFTER: ${newApi.desc}\n`
    }

    const params = api.params
    if (!keyEqOrd(params, newApi.params)) {
      res += ` - \`@${fnFormat(event, params)}\` changed to \`@${fnFormat(event, newApi.params)}\`` + '\n'
      res += desc || newApi.desc
    } else if (desc !== '') {
      res += ` - \`@${fnFormat(event, params)}\` - description changed` + '\n'
      res += desc
    }
    return res
  }).join('\n')
}

oldApis
  .map(filename => {
    const oldApi = require(`./.json-api/${filename}`)
    const newApi = fs.existsSync(`${newApiDir}/${filename}`) && require(`${newApiDir}/${filename}`)
    return { oldApi, newApi, name: filename.substring(0, filename.length - 4) }
  })
  .forEach(({ oldApi, newApi, name }) => {
    if (!newApi) {
      return write(`## ${name}  - removed\n`)
    }
    write(`## ${name}\n`)
    if (oldApi.events) {
      write(diffEvents(oldApi.events, newApi.events))
    }
    //
    // write(`\n## ${name}\n`)
    // return write(diff(oldApi, newApi))
  })

function diff (oldVal, newVal, prefix = ' - ') {
  function rawDiff () {
    if (typeof oldVal === 'object') {
      if (typeof newVal === 'object') {
        return Object.entries(oldVal).map(([key, value]) => {
          if (newVal[key]) {
            return (key + '\n') + diff(value, newVal[key], '  ' + prefix)
          } else {
            return (key + ' => removed\n')
          }
        }).join('\n' + prefix)
      } else {
        return (`|${oldVal} | ${newVal}|\n`)
      }
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (!(arraySetEq(oldVal, newVal))) {
        return (`|${oldVal} | ${newVal}|`)
      }
    } else if (oldVal !== newVal) {
      return (`|${oldVal} | ${newVal}|`)
    }
    return ''
  }

  return prefix + rawDiff()
}
