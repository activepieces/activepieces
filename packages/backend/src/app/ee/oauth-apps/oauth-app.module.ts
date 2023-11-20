import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { oauthAppService } from './oauth-app.service'
import { ListOAuth2AppRequest, UpsertOAuth2AppRequest } from '@activepieces/ee-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'

export const oauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('onRequest', platformMustBeOwnedByCurrentUser)
    await app.register(oauthAppController, { prefix: '/v1/oauth-apps' })
}

const oauthAppController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', {
        schema: {
            body: UpsertOAuth2AppRequest,
        },
    },
    async (request) => {
        const platformId = request.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return oauthAppService.upsert({
            platformId,
            request: request.body,
        })
    },
    )

    app.get('/', {
        schema: {
            querystring: ListOAuth2AppRequest,
        },
    },
    async (request) => {
        const platformId = request.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return oauthAppService.list({
            platformId,
            request: request.query,
        })
    },
    )


    app.delete('/:id', {
        schema: {
            params: GetIdParams,
        },
    },
    async (request) => {
        const platformId = request.principal.platform?.id
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
