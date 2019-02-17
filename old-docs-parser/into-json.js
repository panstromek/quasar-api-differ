module.exports = {
  /**
   *
   * @param {{ tag, events, props, methods }[]} apis
   * @return {*}
   */
  intoJSON (apis) {
    return apis.map(({ tag, events, props, methods }) => {
      const jsonAPI = {
        type: 'component'
      }
      if (events.length) {
        jsonAPI.events = events.reduce((jsonEvents, { name, desc, params }) => ({
          ...jsonEvents,
          [name]: { desc, params: paramsToJSON(params) }
        }), {})
      }
      if (props.length) {
        jsonAPI.props = {}
        props.forEach(({ name, type, desc }) => {
          jsonAPI.props[name] = {
            type: intoJSONAPIType(type),
            desc
          }
        })
      }
      if (methods.length) {
        jsonAPI.methods = {}
        methods.forEach(({ name, params, desc }) => {
          jsonAPI.methods[name] = {
            params: paramsToJSON(params),
            desc
          }
        })
      }
      return { tag, api: jsonAPI }
    })
  }
}

function intoJSONAPIType (type) {
  if (type.length === 1) {
    return type[0]
  }
  return type
}

function paramsToJSON (params) {
  return params.reduce((jsonParams, param) => ({ ...jsonParams, [param]: {} }), {})
}
