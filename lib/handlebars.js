'use strict'

const handlebars = require('handlebars')
const { map } = require('./async')
const requireFromString = require('require-from-string')

module.exports = async function ({ layouts, partials, helpers }, prefix = '') {

  const compiledLayouts = {}
  await map(layouts, async (file) => {
    const contents = await file.src.contents()
    compiledLayouts[prefix + file.src.name] = handlebars.compile(contents)
  })

  await map(partials, async (file) => {
    const contents = await file.src.contents()
    handlebars.registerPartial(prefix + file.src.name, contents)
  })

  await map(helpers, async (file) => {
    const contents = await file.src.contents()
    const helperFunction = requireFromString(contents)
    handlebars.registerHelper(prefix + file.src.name, helperFunction)
  })

  return function (layout, model = {}) {
    let compiledLayout = compiledLayouts[layout]
    if (compiledLayout == null) {
      compiledLayout = handlebars.compile(layout)
      // throw new Error(`layout "${layout}" cannot be found`)
    }
    const templatedContents = compiledLayout(model)
    return templatedContents
  }
}
