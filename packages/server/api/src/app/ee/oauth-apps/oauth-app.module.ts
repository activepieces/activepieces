import {
    ListOAuth2AppRequest,
    OAuthApp,
    UpsertOAuth2AppRequest,
} from '@activepieces/ee-shared'
import { assertNotNullOrUndefined, SeekPage } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Static,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { oauthAppService } from './oauth-app.service'

export const oauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(readOauthAppModule)
    await app.register(writeOauthAppModule)
}

const readOauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(readOauthAppController, { prefix: '/v1/oauth-apps' })
}

const readOauthAppController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
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
}

const writeOauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(oauthAppController, { prefix: '/v1/oauth-apps' })
}

const oauthAppController: FastifyPluginAsyncTypebox = async (app) => {
    app.post(
        '/',
        {
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
