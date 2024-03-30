import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { piecesAnalyticsService } from './pieces-analytics.service'

export const analyticsModule: FastifyPluginAsyncTypebox = async () => {
    await piecesAnalyticsService.init()
}

