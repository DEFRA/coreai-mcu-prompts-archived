const tableConfig = require('../../config/storage')
const { getTableClient } = require('../table-client')

const tableClient = getTableClient(tableConfig.modelTable)

const initialiseTable = async () => {
  await tableClient.createTable(tableConfig.modelTable)
}

const enrichModel = (model) => ({
  partitionKey: model.deploymentVendor,
  rowKey: `${model.deploymentService}|${model.deploymentName}`,
  model: model.model,
  type: model.type
})

const formatModel = (model) => {
  const deployment = model.rowKey.split('|')

  return {
    modelId: `${model.partitionKey}|${model.rowKey}`,
    deploymentVendor: model.partitionKey,
    deploymentService: deployment[0],
    deploymentName: deployment[1],
    model: model.model,
    type: model.type
  }
}

const checkEntityExists = async (partitionKey, rowKey) => {
  try {
    await tableClient.getEntity(partitionKey, rowKey)

    return true
  } catch (error) {
    if (error.statusCode === 404) {
      return false
    }

    throw error
  }
}

const addModel = async (model) => {
  const enriched = enrichModel(model)

  const exists = await checkEntityExists(enriched.partitionKey, enriched.rowKey)

  if (exists) {
    const error = new Error(`Model ${enriched.rowKey} already exists in ${enriched.partitionKey}`)
    error.type = 'MODEL_EXISTS'

    throw error
  }

  await tableClient.createEntity(enriched)
}

const getModel = async (deploymentVendor, deploymentService, deploymentName) => {
  try {
    const model = await tableClient.getEntity(deploymentVendor, `${deploymentService}|${deploymentName}`)

    return formatModel(model)
  } catch (error) {
    if (error.statusCode === 404) {
      return null
    }

    throw error
  }
}

const getModels = async (deploymentVendor) => {
  const query = tableClient.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${deploymentVendor}'`
    }
  })

  const models = []

  for await (const entity of query) {
    models.push(entity)
  }

  return models.map(formatModel)
}

const getAllModels = async () => {
  const query = tableClient.listEntities()

  const models = []

  for await (const entity of query) {
    models.push(entity)
  }
  models.sort((a, b) => a.partitionKey - b.partitionKey)

  const allModels = []
  let vendorModels = []
  let currentVendor = ''

  for await (const entity of models) {
    if (currentVendor !== '' && currentVendor !== entity.partitionKey) {
      allModels.push({
        vendor: currentVendor,
        models: vendorModels.map(formatModel)
      })

      vendorModels = []
    }

    vendorModels.push(entity)
    currentVendor = entity.partitionKey
  }
  allModels.push({
    vendor: currentVendor,
    models: vendorModels.map(formatModel)
  })

  return allModels
}

module.exports = {
  addModel,
  getModel,
  getModels,
  getAllModels,
  initialiseTable
}
