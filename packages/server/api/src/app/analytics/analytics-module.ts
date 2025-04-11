import { FastifyPluginAsync } from 'fastify'
import { analyticsController } from './analytics-controller'

export const analyticsModule: FastifyPluginAsync = async (app) => {
    await app.register(analyticsController, { prefix: '/v1/analytics' })
}
