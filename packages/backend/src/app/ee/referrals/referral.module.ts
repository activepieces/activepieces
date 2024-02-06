import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { ListReferralsRequest } from '@activepieces/shared'
import { referralService } from './referral.service'

export const referralModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(referralController, { prefix: '/v1/referrals' })
}

const DEFAULT_LIMIT_SIZE = 10

const referralController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/', {
        schema: {
            querystring: ListReferralsRequest,
        },
    }, async (request) => {
        return referralService.list(request.principal.id, request.query.cursor ?? null, request.query.limit ?? DEFAULT_LIMIT_SIZE)
    })
}
