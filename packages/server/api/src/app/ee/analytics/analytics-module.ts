import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { analyticsController } from './analytics-controller'
import { piecesAnalyticsService } from './pieces-analytics.service'

export const analyticsModule: FastifyPluginAsyncTypebox = async (app) => {
    await piecesAnalyticsService.init()
    await app.register(analyticsController, { prefix: '/v1/analytics' })
}

