'use strict'

const cp = require('child_process')
const getUuid = require('uuid/v4')

module.exports.fork = (modulepath) => {

  const queue = new Map()
  const forkedModule = cp.fork(modulepath)

  forkedModule.on('message', ({ uuid, data }) => {
    const { resolve, reject } = queue.get(uuid)
    resolve(data)
  })

  const forkedFunction = function (...params) {

    const uuid = getUuid()

    return new Promise((resolve, reject) => {
      queue.set(uuid, { resolve, reject })
      forkedModule.send({ uuid, params })
    })
  }

  return [forkedFunction, () => {
    forkedModule.disconnect()
  }]
}

module.exports.onMessage = (theProcess, callback) => {

  process.on('message', async ({ uuid, params }) => {
    const data = await callback(...params)
    theProcess.send({ uuid, data })
  })
}
