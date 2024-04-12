require('./insights').setup()
const createServer = require('./server')
const { initialiseTable: initModelTable } = require('./storage/repos/models')
const { initialiseTable: initPromptTable } = require('./storage/repos/prompts')

const init = async () => {
  await initModelTable()
  await initPromptTable()
  const server = await createServer()
  await server.start()
  console.log('Server running on %s', server.info.uri)
}

init()
