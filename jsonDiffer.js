const fs = require('fs')
const _ = require('lodash')

let newApiDir = './node_modules/quasar/dist/api'
let oldApiDir = './.json-api'
const oldApis = fs.readdirSync(oldApiDir)

const target = 'api-diff.md'
fs.writeFileSync(target, `# Quasar API rich diff
This is generated - information may be incorrect.
If you find problem, report it please.`)

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

function eventFormat (name, params) {
  if (params) {
    return `@${name}(${Object.keys(params).join(', ')})`
  }
  return `@${name}`

}

function fnFormat (name, params = {}) {
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

function diffAPIs (oldApi, newApi, diffFn, formatNewFn) {
  return Object.entries(oldApi)
    .map(diffFn).filter(r => r)
    .concat(
      ...Object.entries(newApi)
        .filter(([event]) => !oldApi[event])
        .map(formatNewFn)
    ).join('\n')
}

function diffEvents (oldEvents, newEvents = {}) {
  const formatNewEvent = ([event, api]) => {
    return ` - \`@${fnFormat(event, api.params)}\` - NEW\n   - ` + api.desc
  }
  const diffOldEvent = ([event, api]) => {
    if (!newEvents[event]) {
      return ` - \`${eventFormat(event, api.params)}\` was removed\n`
    }
    const newApi = newEvents[event]
    let res = ''
    let desc = resolveDesc(api, newApi)

    const params = api.params
    if (!keyEqOrd(params, newApi.params)) {
      res += ` - \`${eventFormat(event, params)}\` changed to \`${eventFormat(event, newApi.params)}\`` + '\n'
      res += desc || newApi.desc
    }

    return res
  }
  return diffAPIs(oldEvents, newEvents, diffOldEvent, formatNewEvent)
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

    if (!jsonTypeEq(api.type, newApi.type)) {
      return ` - \`${prop}\` - type changed from \`${api.type}\` to \`${api.type}\`
${resolveDesc(api, newApi)}`
    }
  }).filter(r => r).join('\n')
}

function diffMethods (oldMethods, newMethods = {}) {
  return Object.entries(oldMethods).map(([method, api]) => {
    const params = api.params
    if (!newMethods[method]) {
      return ` - \`${fnFormat(method, params)}\` was removed\n`
    }
    const newApi = newMethods[method]
    if (!keyEqOrd(params, newApi.params)) {
      return ` - \`${fnFormat(method, params)}\` changed to \`${fnFormat(method, newApi.params)}\`` + '\n'
        + resolveDesc(api, newApi)
    }
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

    if (oldApi.methods) {
      write(diffMethods(oldApi.methods, newApi.methods))
    }
  })

