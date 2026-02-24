import {
    ListOAuth2AppRequest,
    OAuthApp,
    UpsertOAuth2AppRequest,
} from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, PrincipalType, SeekPage } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Static,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { oauthAppService } from './oauth-app.service'

export const oauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(oauthAppController, { prefix: '/v1/oauth-apps' })
}

const oauthAppController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            config: {
                security: securityAccess.platformAdminOnly([PrincipalType.USER]),
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

const GetIdParams = Type.Object({
    id: Type.String(),
})

type GetIdParams = Static<typeof GetIdParams>
