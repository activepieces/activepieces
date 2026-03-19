import {
    AddDomainRequest,
    assertNotNullOrUndefined,
    ListCustomDomainsRequest, PrincipalType } from '@activepieces/shared'
import { HttpStatusCode } from 'axios'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { customDomainService } from './custom-domain.service'

const GetOneRequest = z.object({
    id: z.string(),
})
type GetOneRequest = z.infer<typeof GetOneRequest>

export const customDomainModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.customDomainsEnabled))
    await app.register(customDomainController, { prefix: '/v1/custom-domains' })
}

const customDomainController: FastifyPluginAsyncZod = async (app) => {
    app.post(
        '/',
        {
            schema: {
                body: AddDomainRequest,
            },
            config: {
                security: securityAccess.platformAdminOnly([PrincipalType.USER]),
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
            config: {
                security: securityAccess.platformAdminOnly([PrincipalType.USER]),
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
            config: {
                security: securityAccess.platformAdminOnly([PrincipalType.USER]),
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
