import { AppSystemProp, system } from '@activepieces/server-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { analyticsService } from './analytics.service'
import { piecesAnalyticsService } from './pieces-analytics.service'

export const analyticsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await piecesAnalyticsService.init()
    await app.register(analyticsController, { prefix: '/v1/analytics' })
}

const analyticsController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', async (request) => {
        const { platform } = request.principal
        const cloudPlatformId = system.get(AppSystemProp.CLOUD_PLATFORM_ID)
        if (platform.id === cloudPlatformId) {
            return {
                totalFlows: 0,
                activeFlows: 0,
                totalUsers: 0,
                totalProjects: 0,
                activeProjects: 0,
                uniquePiecesUsed: 0,
                activeFlowsWithAI: 0,
                topPieces: [],
                tasksUsage: [],
                topProjects: [],
            }
        }
        return analyticsService.generateReport(platform.id)
    })
}