import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { platformPlanController } from './platform-plan.controller'

export const platformPlanModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformPlanController, { prefix: '/v1/platform-billing' })
}
