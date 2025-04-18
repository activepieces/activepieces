import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { analyticsController } from './analytics-controller'

export const analyticsModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(analyticsController, { prefix: '/v1/analytics' })
}
