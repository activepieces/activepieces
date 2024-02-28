import {
    ActivepiecesError,
    ErrorCode,
    PlatformRole,
    isNil,
} from '@activepieces/shared'
import { onRequestAsyncHookHandler } from 'fastify'

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

      const canEditPlatform =
      request.principal.platform.role === PlatformRole.OWNER
      if (!canEditPlatform) {
          throw USER_NOT_ALLOWED_TO_PERFORM_OPERATION_ERROR
      }
  }
