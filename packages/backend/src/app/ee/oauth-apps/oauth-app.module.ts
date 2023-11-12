import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { oauthAppService } from './oauth-app.service'
import { ListOAuth2AppRequest, UpsertOAuth2AppRequest } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, assertNotNullOrUndefined } from '@activepieces/shared'
import { platformService } from '../platform/platform.service'

export const oauthAppModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(oauthAppController, { prefix: '/v1/oauth-apps' })
}

const oauthAppController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', {
        schema: {
            body: UpsertOAuth2AppRequest,
        },
    },
    async (request) => {
        const platformId = request.principal.platformId
        assertNotNullOrUndefined(platformId, 'platformId')
        await assertUserIsPlatformOwner({
            platformId,
            userId: request.principal.id,
        })
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
        const platformId = request.principal.platformId
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
        assertNotNullOrUndefined(request.principal.platformId, 'platformId')
        await assertUserIsPlatformOwner({
            platformId: request.principal.platformId,
            userId: request.principal.id,
        })
        return oauthAppService.delete({
            platformId: request.principal.platformId,
            id: request.params.id,
        })
    },
    )
}

// TODO to be removed when we have a proper authorization system that has role and middleware
const assertUserIsPlatformOwner = async ({ platformId, userId }: { platformId: string, userId: string }): Promise<string> => {

    const userIsOwner = await platformService.checkUserIsOwner({
        platformId,
        userId,
    })

    if (!userIsOwner) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }

    return platformId
}

const GetIdParams = Type.Object({
    id: Type.String(),
})

type GetIdParams = Static<typeof GetIdParams>