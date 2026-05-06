import {
    assertNotNullOrUndefined,
    ListOAuth2AppRequest,
    OAuthApp,
    PrincipalType, SeekPage, UpsertOAuth2AppRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { oauthAppService } from './oauth-app.service'

export const oauthAppModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(oauthAppController, { prefix: '/v1/oauth-apps' })
}

const oauthAppController: FastifyPluginAsyncZod = async (app) => {
    app.get(
        '/',
        {
            config: {
                security: securityAccess.publicPlatform([PrincipalType.USER]),
            },
            schema: {
                querystring: ListOAuth2AppRequest,
                response: {
                    [StatusCodes.OK]: SeekPage(OAuthApp),
                },
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return oauthAppService.list({
                platformId,
                request: request.query,
            })
        },
    )

    app.post(
        '/',
        {
            config: {
                security: securityAccess.platformAdminOnly([PrincipalType.USER]),
            },
            schema: {
                body: UpsertOAuth2AppRequest,
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return oauthAppService.upsert({
                platformId,
                request: request.body,
            })
        },
    )

    app.delete(
        '/:id',
        {
            config: {
                security: securityAccess.platformAdminOnly([PrincipalType.USER]),
            },
            schema: {
                params: GetIdParams,
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return oauthAppService.delete({
                platformId,
                id: request.params.id,
            })
        },
    )
}

const GetIdParams = z.object({
    id: z.string(),
})

type GetIdParams = z.infer<typeof GetIdParams>
