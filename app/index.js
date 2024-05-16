require('./insights').setup()
const createServer = require('./server')
const { initialiseTable: initModelTable } = require('./storage/repos/models')
const { initialiseTable: initPromptTable } = require('./storage/repos/prompts')

const init = async () => {
  const server = await createServer()
  await server.start()

  if (process.env.INIT_STORAGE) {
    await initModelTable()
    await initPromptTable()
  }
  
  console.log('Server running on %s', server.info.uri)
}

init()
