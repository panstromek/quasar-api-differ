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

function resolveDesc (api, newApi) {
  let desc = ''
  if (api.desc !== newApi.desc) {
    desc += `   - BEFORE: ${api.desc}\n`
    desc += `   - AFTER: ${newApi.desc}\n`
  }
  return desc
}

function diffEvents (oldEvents, newEvents = {}) {
  return Object.entries(oldEvents).map(([event, api]) => {
    if (!newEvents[event]) {
      return ` - \`@${event}\` was removed\n`
    }
    const newApi = newEvents[event]
    let res = ''
    let desc = resolveDesc(api, newApi)

    const params = api.params
    if (!keyEqOrd(params, newApi.params)) {
      res += ` - \`@${fnFormat(event, params)}\` changed to \`@${fnFormat(event, newApi.params)}\`` + '\n'
      res += desc || newApi.desc
    }

    return res
  }).filter(r => r).join('\n')
}

function jsonTypeEq (api, newApi) {
  return arraySetEq([api].flat(1), [newApi].flat(1))
}

function diffProps (oldProps, newProps) {
  return Object.entries(oldProps).map(([prop, api]) => {
    if (!newProps[prop]) {
      return ` - \`${prop}\` was removed\n`
    }
    const newApi = newProps[prop]
    let res = ''

    let desc = resolveDesc(api, newApi)
    if (!jsonTypeEq(api.type, newApi.type)) {
      res += ` - \`${prop}\` - type changed from \`${api.type}\` to \`${newApi.type}\`\n`
      res += desc
    }
    return res
  }).filter(r => r).join('\n')
}

oldApis
  .map(filename => {
    const oldApi = require(`./.json-api/${filename}`)
    const newApi = fs.existsSync(`${newApiDir}/${filename}`) && require(`${newApiDir}/${filename}`)
    return { oldApi, newApi, name: filename.substring(0, filename.length - 5) }
  })
  .forEach(({ oldApi, newApi, name }) => {
    if (!newApi) {
      return write(`## ${name}  - removed\n`)
    }
    write(`\n## ${name}\n`)
    if (oldApi.props) {
      write(diffProps(oldApi.props, newApi.props))
    }
    if (oldApi.events) {
      write(diffEvents(oldApi.events, newApi.events))
    }
  })

