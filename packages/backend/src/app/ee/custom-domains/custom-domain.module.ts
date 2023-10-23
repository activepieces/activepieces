import { CreateDomainRequest, ListCustomDomainsRequest } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { customDomainService } from './custom-domain.service'
import { HttpStatusCode } from 'axios'
import { assertNotNullOrUndefined } from '@activepieces/shared'


const GetOneRequest = Type.Object({
    id: Type.String(),
})
type GetOneRequest = Static<typeof GetOneRequest>

export const customDomainModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(customDomainController, { prefix: '/v1/custom-domains' })
}

const customDomainController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post(
        '/',
        {
            schema: {
                body: CreateDomainRequest,
            },
        },
        async (
            request,
            reply,
        ) => {
            const platformId = request.principal.platformId
            assertNotNullOrUndefined(platformId, 'platformId')
            const domain = await customDomainService.getOneByDomain({
                domain: request.body.domain,
            })
            if (domain) {
                await reply.status(HttpStatusCode.Conflict).send({
                    message: `Domain ${request.body.domain} already exists`,
                })
                return
            }
            return customDomainService.create({
                domain: request.body.domain,
                platformId,
            })
        },
    )

    fastify.post(
        '/:id/verify',
        {
            schema: {
                params: GetOneRequest,
            },
        },
        async (
            request,
        ) => {
            const platformId = request.principal.platformId
            assertNotNullOrUndefined(platformId, 'platformId')
            return customDomainService.check({
                id: request.params.id,
                platformId,
            })
        },
    )

    fastify.get('/', {
        schema: {
            querystring: ListCustomDomainsRequest,
        },
    }, async (request) => {
        const platformId = request.principal.platformId
        assertNotNullOrUndefined(platformId, 'platformId')
        return customDomainService.list({
            platformId,
            request: request.query,
        })
    })

    fastify.delete(
        '/:id',
        {
            schema: {
                params: GetOneRequest,
            },
        },
        async (
            request,
        ) => {
            const platformId = request.principal.platformId
            assertNotNullOrUndefined(platformId, 'platformId')
            return customDomainService.delete({
                id: request.params.id,
                platformId,
            })
        },
    )
}