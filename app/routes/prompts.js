const Joi = require('joi')
const { addPrompt, getPrompt, getPrompts } = require('../storage/repos/prompts')

module.exports = [{
  method: 'GET',
  path: '/prompts/{project}/{model}/{type}',
  options: {
    validate: {
      params: Joi.object({
        project: Joi.string().required(),
        model: Joi.string().required(),
        type: Joi.string().required().allow('correspondence', 'briefing')
      })
    }
  },
  handler: async (request, h) => {
    const { project, model, type } = request.params

    const prompts = await getPrompts(project, model, type)

    if (prompts.length === 0) {
      return h.response().code(204)
    }

    return h.response(prompts).code(200)
  }
},
{
  method: 'GET',
  path: '/prompts/{project}/{model}/{type}/{name}',
  options: {
    validate: {
      params: Joi.object({
        project: Joi.string().required(),
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
    const { project, model, type, name } = request.params
    const { version } = request.query

    const prompt = await getPrompt(project, model, type, name, version)

    if (!prompt) {
      return h.response().code(404)
    }

    return h.response(prompt).code(200)
  }
},
{
  method: 'POST',
  path: '/prompts',
  options: {
    validate: {
      payload: Joi.object({
        project: Joi.string().required(),
        name: Joi.string().required(),
        modelId: Joi.string().required(),
        prompt: Joi.string().required(),
        type: Joi.string().required().allow('correspondence', 'briefing')
      })
    }
  },
  handler: async (request, h) => {
    await addPrompt(request.payload)

    return h.response().code(201)
  }
}]
