import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { onRequestAsyncHookHandler } from 'fastify'
import { platformService } from '../platform/platform.service'

const USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR = new ActivepiecesError({
    code: ErrorCode.AUTHORIZATION,
    params: {},
})

export const platformMustBeOwnedByCurrentUser: onRequestAsyncHookHandler = async (request, _res) => {
    const platformId = request.principal.platform?.id

    if (isNil(platformId)) {
        throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
    }

    const platform = await platformService.getOne(platformId)

    if (isNil(platform) || platform.ownerId !== request.principal.id) {
        throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
    }
}
