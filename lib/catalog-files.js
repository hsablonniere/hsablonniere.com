'use strict'

const Catalog = require('./Catalog')
const glob = require('glob-promise')
const { map, mapFlatten } = require('./async')

module.exports = async function (...allDirectories) {

  const catalog = new Catalog()

  const allPatterns = allDirectories.map((dir) => dir + '/**')
  const allFiles = await mapFlatten(allPatterns, (pattern) => glob(pattern))

  await map(allFiles, (item) => catalog.add(item))

  return catalog
}
