import { onRequestAsyncHookHandler } from 'fastify'
import { userService } from '../../user/user-service'
import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'

const USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR = new ActivepiecesError({
    code: ErrorCode.AUTHORIZATION,
    params: {},
})

export const platformMustBeOwnedByCurrentUser: onRequestAsyncHookHandler =
    async (request, _res) => {
        const platformId = request.principal.platform.id

        if (isNil(platformId)) {
            throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
        }

        const isApiKey = request.principal.type === PrincipalType.SERVICE
        if (isApiKey) {
            return
        }

        const user = await userService.getMetaInfo({
            id: request.principal.id,
        })

        if (isNil(user)) {
            throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
        }

        const canEditPlatform = user.platformRole === PlatformRole.ADMIN && user.platformId === platformId
        if (!canEditPlatform) {
            throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
        }
    }
