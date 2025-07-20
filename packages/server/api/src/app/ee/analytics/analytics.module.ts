import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { analyticsService } from './analytics.service'
import { piecesAnalyticsService } from './pieces-analytics.service'

export const analyticsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.analyticsEnabled))
    await piecesAnalyticsService(app.log).init()
    await app.register(analyticsController, { prefix: '/v1/analytics' })
}

const analyticsController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', async (request) => {
        const { platform } = request.principal
        return analyticsService(request.log).generateReport(platform.id)
    })
}