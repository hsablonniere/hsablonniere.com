'use strict'

const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')

const $$catalogFiles = Symbol()

async function contents () {
  return fs.readFile(this.path, 'utf-8')
}

class Catalog {

  constructor () {
    this[$$catalogFiles] = []
  }

  async add (filepath) {

    const stats = await fs.stat(filepath)

    if (stats.isDirectory()) {
      return
    }

    const src = path.parse(filepath)
    const file = {
      src: {
        dirs: src.dir.split('/'),
        name: src.name,
        ext: src.ext,
        path: filepath,
        contents,
      },
    }

    // file.type = ''
    // file.isTheme = file.src.dirs[0] === 'theme'
    //
    // if (!file.isTheme) {
    //   file.page = {
    //     // name of the page (directory name)
    //     name: file.src.dirs[1],
    //     shortid: '', // unique shortid for the page
    //     tags: [], // article, talk, experiment...
    //   }
    //   file.page.isMainFile = (file.src.name === file.page.name) && (['.html', '.adoc', '.hbs'].includes(file.src.ext))
    // }

    file.isTheme = (file.src.dirs[0] === 'theme')

    if (file.src.dirs[0] === 'pages') {
      // name of the page (directory name)
      file.page = { name: file.src.dirs[1] }
    }

    this[$$catalogFiles].push(file)
  }

  getThemeTemplateFiles () {
    const layouts = _.filter(this[$$catalogFiles], (file) => {
      return file.src.dirs[0] === 'theme' && file.src.dirs[1] === 'layouts' && file.src.ext === '.hbs'
    })
    const partials = _.filter(this[$$catalogFiles], (file) => {
      return file.src.dirs[0] === 'theme' && file.src.dirs[1] === 'partials' && file.src.ext === '.hbs'
    })
    const helpers = _.filter(this[$$catalogFiles], (file) => {
      return file.src.dirs[0] === 'theme' && file.src.dirs[1] === 'helpers' && file.src.ext === '.js'
    })
    return { layouts, partials, helpers }
  }

  getSpecialPage (pageName) {
    return _.find(this[$$catalogFiles], (file) => {
      return file.src.dirs[0] === 'pages'
        && file.src.dirs[1] === '@' + pageName
        && file.src.name === pageName
        && file.src.ext === '.hbs'
    })
  }

  getAsciidocPages () {
    return _(this[$$catalogFiles])
      .filter((file) => {
        return file.src.dirs[0] === 'pages'
          && file.src.dirs[1] !== '@home'
          && file.src.dirs[1] !== '@404'
          && file.src.dirs[1] === file.src.name
      })
      .value()
  }

  getPageFiles (page) {
    return _(this[$$catalogFiles])
      .filter((file) => {
        return file.src.dirs[0] === 'pages'
          && file.src.dirs[1] === page.src.name
          && file !== page
      })
      .value()
  }

  getThemeAssets () {
    return _.filter(this[$$catalogFiles], (file) => {
      return file.src.dirs[0] === 'theme'
        && file.src.dirs[1] !== 'layouts'
        && file.src.dirs[1] !== 'partials'
        && file.src.dirs[1] !== 'helpers'
    })
  }
}

module.exports = Catalog
