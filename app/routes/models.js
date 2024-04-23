const Joi = require('joi')
const { addModel, getModels, getAllModels, getModel } = require('../storage/repos/models')

module.exports = [{
  method: 'GET',
  path: '/models',
  options: {
    validate: {
      query: Joi.object({
        deploymentVendor: Joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const models = await getModels(request.query.deploymentVendor)

    if (models.length === 0) {
      return h.response().code(204)
    }

    return h.response(models).code(200)
  }
},
{
  method: 'GET',
  path: '/allmodels',
  handler: async (request, h) => {
    const models = await getAllModels()

    if (models.length === 0) {
      return h.response().code(204)
    }

    return h.response(models).code(200)
  }
},
{
  method: 'GET',
  path: '/models/{vendor}/{service}/{deploymentName}',
  options: {
    validate: {
      params: Joi.object({
        vendor: Joi.string().required(),
        service: Joi.string().required(),
        deploymentName: Joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const { vendor, service, deploymentName } = request.params

    const model = await getModel(vendor, service, deploymentName)

    if (!model) {
      return h.response().code(404)
    }

    return h.response(model).code(200)
  }
},
{
  method: 'POST',
  path: '/models',
  options: {
    validate: {
      payload: Joi.object({
        deploymentName: Joi.string().required(),
        deploymentVendor: Joi.string().required(),
        deploymentService: Joi.string().required(),
        model: Joi.string().required(),
        type: Joi.string().required().valid('completion', 'chat', 'embedding')
      })
    }
  },
  handler: async (request, h) => {
    try {
      await addModel(request.payload)
    } catch (error) {
      if (error.type === 'MODEL_EXISTS') {
        return h.response(error.message).code(409)
      }

      throw error
    }

    return h.response().code(201)
  }
}]
