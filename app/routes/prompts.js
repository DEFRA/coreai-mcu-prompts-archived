const Joi = require('joi')
const { addPrompt, getPrompt, getPrompts } = require('../storage/repos/prompts')

module.exports = [
  {
    method: 'GET',
    path: '/prompts/mcu',
    options: {
      validate: {
        query: Joi.object({
          modelId: Joi.string().required(),
          type: Joi.string().required()
        })
      }
    },
    handler: async (request, h) => {
      const { modelId, type } = request.query

      const prompts = await getPrompts('mcu', modelId, type)

      return h.response(prompts).code(200)
    }
  },
  {
    method: 'GET',
    path: '/prompts/mcu/{model}/{type}/{name}',
    options: {
      validate: {
        params: Joi.object({
          model: Joi.string().required(),
          type: Joi.string().required().allow('correspondence', 'briefing'),
          name: Joi.string().required()
        }),
        query: Joi.object({
          version: Joi.number()
        })
      }
    },
    handler: async (request, h) => {
      const { model, type, name } = request.params
      const { version } = request.query

      const prompt = await getPrompt('mcu', model, type, name, version)
      
      if (!prompt) {
        return h.response().code(404)
      }

      return h.response(prompt).code(200)
    }
  },
  {
    method: 'POST',
    path: '/prompts/mcu',
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          modelId: Joi.string().required(),
          prompt: Joi.string().required(),
          project: Joi.string().required(),
          type: Joi.string().required().allow('correspondence', 'briefing')
        })
      }
    },
    handler: async (request, h) => {
      await addPrompt(request.payload)

      return h.response().code(201)
    }
  }
]
