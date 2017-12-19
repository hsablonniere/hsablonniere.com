'use strict'

const asciidoctor = require('asciidoctor.js')()
const fs = require('fs-extra')
const path = require('path')
const { onMessage } = require('./promised-fork')

onMessage(process, async (docfile, docname, docfilesuffix) => {

  const asciidoc = await fs.readFile(docfile, 'utf8')
  const ast = asciidoctor.load(asciidoc, {
    sectanchors: '',
    idprefix: '',
    idseparator: '-',
    icons: 'font',
    docname,
    docfile,
    docfilesuffix,
  })
  const attributes = ast.getAttributes()
  const html = ast.convert()
  return { attributes, html }
})
