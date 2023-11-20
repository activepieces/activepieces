import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { onRequestAsyncHookHandler } from 'fastify'
import { platformService } from '../platform/platform.service'

export const platformMustBeOwnedByCurrentUser: onRequestAsyncHookHandler = async (request, _res) => {
    const platformId = request.principal.platform?.id
    if (isNil(platformId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
    const platform = await platformService.getOne(platformId)
    if (isNil(platform)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: `Platform with id ${platformId} not found`,
            },
        })
    }
    if (platform.ownerId !== request.principal.id) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}
