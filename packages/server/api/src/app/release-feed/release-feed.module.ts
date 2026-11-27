import { GetReleaseFeedResponse, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { releaseFeedService } from './release-feed.service'

export const releaseFeedModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(releaseFeedController, { prefix: '/v1/releases' })
}

const releaseFeedController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', GetReleaseFeedRequest, async (request) => {
        return releaseFeedService(request.log).get()
    })
}

const GetReleaseFeedRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['releases'],
        description: 'Releases published to the release feed, with the time the instance last fetched it',
        response: {
            200: GetReleaseFeedResponse,
        },
    },
}
