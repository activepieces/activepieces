import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { UpdatePlatformRequestBody } from '@activepieces/ee-shared'
import { ActivepiecesError, ApId, ErrorCode, assertNotNullOrUndefined } from '@activepieces/shared'
import { platformService } from './platform.service'

export const platformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id', UpdatePlatformRequest, async (req) => {
        const platformId = req.principal.platformId
        assertPlatformOwnedNotEqual(req.params.id, platformId)
        assertNotNullOrUndefined(platformId, 'platformId')
        return platformService.update({
            id: platformId,
            userId: req.principal.id,
            ...req.body,
        })
    })

    app.get('/:id', GetPlatformRequest, async (req) => {
        const platformId = req.principal.platformId
        assertPlatformOwnedNotEqual(req.params.id, platformId)
        assertNotNullOrUndefined(platformId, 'platformId')
        return platformService.getOneOrThrow(platformId)
    })
}

const assertPlatformOwnedNotEqual = (platformId: string, jwtPrincipalId: string | undefined): void => {
    if (platformId !== jwtPrincipalId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}


const UpdatePlatformRequest = {
    schema: {
        body: UpdatePlatformRequestBody,
        params: Type.Object({
            id: ApId,
        }),
    },
}

const GetPlatformRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
