import {
    AddDomainRequest,
    ListCustomDomainsRequest,
} from '@activepieces/ee-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Static,
    Type,
} from '@fastify/type-provider-typebox'
import { HttpStatusCode } from 'axios'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { customDomainService } from './custom-domain.service'

const GetOneRequest = Type.Object({
    id: Type.String(),
})
type GetOneRequest = Static<typeof GetOneRequest>

export const customDomainModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.customDomainsEnabled))
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(customDomainController, { prefix: '/v1/custom-domains' })
}

const customDomainController: FastifyPluginAsyncTypebox = async (app) => {
    app.post(
        '/',
        {
            schema: {
                body: AddDomainRequest,
            },
        },
        async (request, reply) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')

            const domain = await customDomainService.getOneByDomain({
                domain: request.body.domain,
            })

            if (domain) {
                return reply.status(HttpStatusCode.Conflict).send({
                    message: `Domain ${request.body.domain} already exists`,
                })
            }

            const customDomain = await customDomainService.create({
                domain: request.body.domain,
                platformId,
            })

            return reply.status(StatusCodes.CREATED).send(customDomain)
        },
    )

    app.get(
        '/',
        {
            schema: {
                querystring: ListCustomDomainsRequest,
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')

            return customDomainService.list({
                platformId,
                request: request.query,
            })
        },
    )

    app.delete(
        '/:id',
        {
            schema: {
                params: GetOneRequest,
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return customDomainService.delete({
                id: request.params.id,
                platformId,
            })
        },
    )
}
