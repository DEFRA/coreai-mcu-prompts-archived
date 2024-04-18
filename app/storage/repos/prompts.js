const tableConfig = require('../../config/storage')
const { getTableClient } = require('../table-client')

const tableClient = getTableClient(tableConfig.promptTable)

const initialiseTable = async () => {
  await tableClient.createTable(tableConfig.promptTable)
}

const calculateRowKey = (name, version) => {
  const escaped = name.toLowerCase().replace(' ', '_')

  return version ? `${escaped}:${version}` : escaped
}

const enrichPrompt = (prompt) => ({
  partitionKey: `${prompt.project}_${prompt.modelId}_${prompt.type}`,
  rowKey: calculateRowKey(prompt.name, prompt.version),
  prompt: prompt.prompt,
  name: prompt.name
})

const formatPrompt = (prompt) => {
  const details = prompt.partitionKey.split('_')

  return {
    project: details[0],
    modelId: details[1],
    type: details[2],
    name: prompt.name,
    prompt: prompt.prompt,
    version: prompt.version
  }
}

const checkEntityExists = async (partitionKey, rowKey) => {
  try {
    const entity = await tableClient.getEntity(partitionKey, rowKey)

    return entity
  } catch (error) {
    if (error.statusCode === 404) {
      return false
    }

    throw error
  }
}

const addPrompt = async (prompt) => {
  const enriched = enrichPrompt(prompt)

  const exists = await checkEntityExists(enriched.partitionKey, enriched.rowKey)

  if (!exists) {
    await tableClient.createEntity({ ...enriched, version: 1 })
    await tableClient.createEntity({ ...enriched, rowKey: `${enriched.rowKey}:1`, version: 1 })
  } else {
    const version = parseInt(exists.version) + 1

    await tableClient.updateEntity({ ...enriched, version })
    await tableClient.createEntity({ ...enriched, rowKey: `${enriched.rowKey}:${version}`, version })
  }
}

const getPrompts = async (project, modelId, type) => {
  const query = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${project}_${modelId}_${type}'`
    }
  })

  const prompts = []

  for await (const entity of query) {
    prompts.push(entity)
  }

  const reduced = prompts.reduce((acc, prompt) => {
    const formatted = formatPrompt(prompt)

    const existingIndex = acc.findIndex(p => p.name === formatted.name)
    const existing = acc[existingIndex]

    if (existingIndex !== -1) {
      if (formatted.version > existing.version) {
        acc[existingIndex] = formatted
      }
    } else {
      acc.push(formatted)
    }

    return acc
  }, [])

  return reduced
}

const getPrompt = async (project, modelId, type, name, version) => {
  const partitionKey = `${project}_${modelId}_${type}`
  const rowKey = calculateRowKey(name, version)

  try {
    const entity = await tableClient.getEntity(partitionKey, rowKey)

    return formatPrompt(entity)
  } catch (error) {
    if (error.statusCode === 404) {
      return null
    }

    throw error
  }
}

module.exports = {
  addPrompt,
  getPrompt,
  getPrompts,
  initialiseTable
}
