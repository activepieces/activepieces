import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformCopilotController } from './platform-copilot.controller'

export const platformCopilotModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformCopilotController, { prefix: '/v1/platform-copilot' })
}
