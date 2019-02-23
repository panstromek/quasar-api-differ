const { arraySetEq } = require('../utils/eq')
const { keyEqOrd } = require('../utils/eq')
const me = module.exports = {

  generateMarkdownDiff (allAPIs = [], replacedByList = {}) {
    return allAPIs
      .map(({ oldApi, newApi, name, replacement }) => {
        if (!newApi) {
          let res = (`## ${name}  - removed\n`)
          if (replacedByList[name]) {
            res += `   - ${replacedByList[name] || ''}\n`
          }
          return res
        }
        let res = ''

        function write (data) {
          res += data
        }

        if (oldApi) {
          write(`\n## ${name}\n`)
        } else {
          write(`\n## ${name} - **NEW**`)
          if (name === 'QMenu') {
            write(` - replaces QPopover and QContextMenu`)
          }
          write(`\n`)
          oldApi = {}
        }

        const propDiff = me.diffProps(oldApi.props, newApi.props).trimRight()
        if (propDiff) {
          write(`#### Props\n` + propDiff + '\n')
        }
        const eventDiff = me.diffEvents(oldApi.events, newApi.events).trimRight()
        if (eventDiff) {
          write(`#### Events\n` + eventDiff + '\n')
        }
        const methodDiff = me.diffMethods(oldApi.methods, newApi.methods).trimRight()
        if (methodDiff) {
          write(`#### Methods\n` + methodDiff + '\n')
        }
        return res
      }).join('')
  },

  fnFormat (name, params = {}) {
    return `${name}(${Object.keys(params).join(', ')})`
  },

  resolveDesc (oldApi, newApi) {
    return (oldApi.desc === newApi.desc && `   - BEFORE: ${oldApi.desc}\n   - AFTER: ${newApi.desc}\n`) || ''
  },

  diffAPIs (oldApi = {}, newApi = {}, diffFn, formatNewFn) {
    return Object.entries(oldApi)
      .map(diffFn).filter(r => r)
      .concat(
        ...Object.entries(newApi)
          .filter(([event]) => !oldApi[event])
          .map(formatNewFn)
      ).join('\n') + '\n'
  },

  diffEvents (oldEvents, newEvents = {}) {
    return me.diffAPIs(oldEvents, newEvents, ([event, api]) => {
      if (!newEvents[event]) {
        return ` - \`${me.eventFormat(event, api.params)}\` was removed\n`
      }
      const newApi = newEvents[event]
      const params = api.params
      if (!keyEqOrd(params, newApi.params)) {
        return ` - \`${me.eventFormat(event, params)}\` changed to \`${me.eventFormat(event, newApi.params)}\`
${me.resolveDesc(api, newApi)}`
      }
    }, ([event, api]) => ` - \`${me.eventFormat(event, api.params)}\` - **NEW**\n   - ${api.desc}`)
  },

  jsonTypeEq (api, newApi) {
    return arraySetEq([api].flat(1), [newApi].flat(1))
  },

  diffProps (oldProps, newProps) {
    return me.diffAPIs(oldProps, newProps, ([prop, api]) => {
      if (!newProps[prop]) {
        return ` - \`${prop}\` was removed\n`
      }
      const newApi = newProps[prop]

      if (!me.jsonTypeEq(api.type, newApi.type)) {
        return ` - \`${prop}\` - type changed from \`${api.type}\` to \`${newApi.type}\`
${me.resolveDesc(api, newApi)}`
      }
    }, ([prop, api]) => {
      return ` - \`${prop}\`: {${[api.type].flat(1).join('|')}}  - **NEW**\n   - ${api.desc}`
    })
  },

  diffMethods (oldMethods, newMethods = {}) {
    return me.diffAPIs(oldMethods, newMethods,
      ([method, api]) => {
        const params = api.params
        if (!newMethods[method]) {
          return ` - \`${me.fnFormat(method, params)}\` was removed\n`
        }
        const newApi = newMethods[method]
        if (!keyEqOrd(params, newApi.params)) {
          return ` - \`${me.fnFormat(method, params)}\` changed to \`${me.fnFormat(method, newApi.params)}\`` + '\n' +
            me.resolveDesc(api, newApi)
        }
      },
      ([method, api]) => ` - \`${me.fnFormat(method, api.params)}\`  - **NEW**\n   - ${api.desc}`)
  },

  eventFormat (name, params) {
    if (params) {
      return `@${name}(${Object.keys(params).join(', ')})`
    }
    return `@${name}`
  }
}
