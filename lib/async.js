'use strict'

const _ = require('lodash')

module.exports = {
  map (collection, iterator) {
    return Promise.all(_.map(collection, iterator))
  },
  async mapFlatten (collection, iterator) {
    const result = await Promise.all(_.map(collection, iterator))
    return _.flatten(result)
  },
}
