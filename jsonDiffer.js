const fs = require('fs')
const _ = require('lodash')
const { arraySetEq } = require('./utils/eq')
const { keyEqOrd } = require('./utils/eq')

const { intoJSONAPI } = require('./old-docs-parser/vetur')

let newApiDir = './node_modules/quasar/dist/api'
let oldApiDir = './.json-api'
const oldApis = fs.readdirSync(oldApiDir)

const oldTags = require('./old/quasar-tags')
const oldAttrs = require('./old/quasar-attributes')
const { mergeApis } = require('./utils/mergeAPIs')

const veturAPIs = intoJSONAPI(oldTags, oldAttrs)

const target = 'api-diff.md'

const replacements = _.fromPairs(require('./v1-replacements.json'))

fs.writeFileSync(target, `# Quasar API XOR (old XOR new)
This is generated - information may be incorrect.
If you find problem, report it please.

`)

function write (data) {
  fs.appendFileSync(target, data)
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

function resolveDesc (oldApi, newApi) {
  return oldApi.desc === newApi.desc && `   - BEFORE: ${oldApi.desc}\n   - AFTER: ${newApi.desc}\n` || ''
}

function diffAPIs (oldApi, newApi = {}, diffFn, formatNewFn) {
  return Object.entries(oldApi)
    .map(diffFn).filter(r => r)
    .concat(
      ...Object.entries(newApi)
        .filter(([event]) => !oldApi[event])
        .map(formatNewFn)
    ).join('\n') + '\n'
}

function diffEvents (oldEvents, newEvents = {}) {
  return diffAPIs(oldEvents, newEvents, ([event, api]) => {
    if (!newEvents[event]) {
      return ` - \`${eventFormat(event, api.params)}\` was removed\n`
    }
    const newApi = newEvents[event]
    const params = api.params
    if (!keyEqOrd(params, newApi.params)) {
      return ` - \`${eventFormat(event, params)}\` changed to \`${eventFormat(event, newApi.params)}\`
${resolveDesc(api, newApi)}`
    }

  }, ([event, api]) => ` - \`${eventFormat(event, api.params)}\` - **NEW**\n   - ${api.desc}`)
}

function jsonTypeEq (api, newApi) {
  return arraySetEq([api].flat(1), [newApi].flat(1))
}

function diffProps (oldProps, newProps) {
  return diffAPIs(oldProps, newProps, ([prop, api]) => {
    if (!newProps[prop]) {
      return ` - \`${prop}\` was removed\n`
    }
    const newApi = newProps[prop]

    if (!jsonTypeEq(api.type, newApi.type)) {
      return ` - \`${prop}\` - type changed from \`${api.type}\` to \`${newApi.type}\`
${resolveDesc(api, newApi)}`
    }
  }, ([prop, api]) => {
    return ` - \`${prop}\`: {${[api.type].flat(1).join('|')}}  - **NEW**\n   - ${api.desc}`
  })
}

function diffMethods (oldMethods, newMethods = {}) {
  return diffAPIs(oldMethods, newMethods, ([method, api]) => {
      const params = api.params
      if (!newMethods[method]) {
        return ` - \`${fnFormat(method, params)}\` was removed\n`
      }
      const newApi = newMethods[method]
      if (!keyEqOrd(params, newApi.params)) {
        return ` - \`${fnFormat(method, params)}\` changed to \`${fnFormat(method, newApi.params)}\`` + '\n'
          + resolveDesc(api, newApi)
      }
    },
    ([method, api]) => ` - \`${fnFormat(method, api.params)}\`  - **NEW**\n   - ${api.desc}`)
}

function desuffix (filename) {
  return filename.substring(0, filename.length - 5)
}

Object.entries(veturAPIs)
  .map(([name, veturApi]) => {
    const filename = name + '.json'
    const oldApi = mergeApis(veturApi,
      fs.existsSync(`./.json-api/${filename}`) ?
        require(`./.json-api/${filename}`) : {})
    const newApi = fs.existsSync(`${newApiDir}/${filename}`) && require(`${newApiDir}/${filename}`)
    return { oldApi, newApi, name }
  })
  .forEach(({ oldApi, newApi, name }) => {
    if (!newApi) {
      return write(`## ${name}  - removed\n   - ${replacements[name]}\n`)
    }
    write(`\n## ${name}\n`)
    if (oldApi.props) {
      const diff = diffProps(oldApi.props, newApi.props).trimRight()
      if (diff) {write(`#### Props\n` + diff + '\n')}
    }
    if (oldApi.events) {
      const diff = diffEvents(oldApi.events, newApi.events).trimRight()
      if (diff) {write(`#### Events\n` + diff + '\n') }
    }
    if (oldApi.methods) {
      const diff = diffMethods(oldApi.methods, newApi.methods).trimRight()
      if (diff) {write(`#### Methods\n` + diff + '\n')}
    }
  })

