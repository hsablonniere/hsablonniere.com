'use strict'

const _ = require('lodash')
const catalogFiles = require('./catalog-files')
const del = require('del')
const fs = require('fs-extra')
const handlebars = require('./handlebars')
const { fork } = require('./promised-fork')
const { map } = require('./async')

const [asciidoctor] = fork('lib/asciidoctor.js')

// del.sync('dist/**/*.*')

catalogFiles('theme', 'pages')
  .then(async (catalog) => {

    const templateFiles = catalog.getThemeTemplateFiles()
    const applyLayout = await handlebars(templateFiles, 'theme/')

    const asciidocPages = catalog.getAsciidocPages()
    await map(asciidocPages, async (page) => {
      const { attributes, html } = await asciidoctor(page.src.path, page.src.name, page.src.ext)
      const fullHtml = await applyLayout('theme/article', {
        title: attributes.doctitle,
        contents: html,
      })
      const slug = _.kebabCase(attributes.doctitle) + '--' + attributes.shortid
      await fs.outputFile('dist/' + slug + '/index.html', fullHtml)
      const pageFiles = catalog.getPageFiles(page)
      await map(pageFiles, (file) => {
        return fs.copy(file.src.path, 'dist/' + slug + '/' + file.src.name + file.src.ext)
      })
    })

    const homePage = catalog.getSpecialPage('home')
    const homePageLayout = await homePage.src.contents()
    const homePageHtml = applyLayout(homePageLayout)
    await fs.outputFile('dist/index.html', homePageHtml)

    const notFoundPage = catalog.getSpecialPage('404')
    const notFoundPageLayout = await notFoundPage.src.contents()
    const notFoundPageHtml = applyLayout(notFoundPageLayout, {})
    await fs.outputFile('dist/404.html', notFoundPageHtml)

    const themeAssets = catalog.getThemeAssets()
    await map(themeAssets, async (file) => {
      let newPath = 'dist/' + file.src.path
      if (file.src.dirs[1] === 'favicons') {
        newPath = 'dist/' + file.src.name + file.src.ext
      }
      await fs.copy(file.src.path, newPath)
    })
  })
  .then(() => process.exit())
  .catch((e) => console.error(e))
