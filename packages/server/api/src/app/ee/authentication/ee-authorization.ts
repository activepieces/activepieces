import { onRequestAsyncHookHandler } from 'fastify'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    Platform,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'

const USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR = new ActivepiecesError({
    code: ErrorCode.AUTHORIZATION,
    params: {},
})

export const platformMustHaveFeatureEnabled = (handler: (platform: Platform) => boolean): onRequestAsyncHookHandler =>
    async (request, _res) => {
        const platformId = request.principal.platform.id

        if (isNil(platformId)) {
            throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
        }

        const platform = await platformService.getOneOrThrow(platformId)
        const enabled = handler(platform)

        if (!enabled) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Feature is disabled',
                },
            })
        }
    }

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
