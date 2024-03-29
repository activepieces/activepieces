import { PrincipalType, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { piecesAnalyticsService } from './pieces-analytics.service'

export const analyticsController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/pieces', GetPiecesStats, async (req, res) => {
        const report = await piecesAnalyticsService.get()
        if (isNil(report)) {
            return res.status(404).send({
                message: 'No report available, please try again later',
            })
        }   
        return report
    })
}
const GetPiecesStats = {
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}