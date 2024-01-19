import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { copilotController } from './copilot.controller'

export const copilotModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(copilotController, { prefix: '/v1/copilot' })
}