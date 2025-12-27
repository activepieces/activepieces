import { LeaderboardReport, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustHaveFeatureEnabled } from '../ee/authentication/ee-authorization'
import { leaderboardService } from './leaderboard.service'

export const leaderboardModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.analyticsEnabled))
    await app.register(leaderboardController, { prefix: '/v1/leaderboard' })
}

const leaderboardController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', LeaderboardRequest, async (request): Promise<LeaderboardReport> => {
        const { platform } = request.principal
        return leaderboardService(request.log).getLeaderboard(platform.id)
    })
}

const LeaderboardRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

