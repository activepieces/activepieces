import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    isNil,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { system } from '../../../helper/system/system'
import { BaseSecurityHandler } from '../security-handler'

export class GlobalApiKeyAuthnHandler extends BaseSecurityHandler {
    private static readonly HEADER_NAME = 'api-key'
    private static readonly API_KEY = system.get(AppSystemProp.API_KEY)

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const routeMatches =
            request.headers[GlobalApiKeyAuthnHandler.HEADER_NAME] !== undefined
        const skipAuth = request.routeOptions.config?.skipAuth ?? false
        return Promise.resolve(routeMatches && !skipAuth)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const requestApiKey = request.headers[GlobalApiKeyAuthnHandler.HEADER_NAME]
        const keyNotMatching = requestApiKey !== GlobalApiKeyAuthnHandler.API_KEY

        if (keyNotMatching || isNil(GlobalApiKeyAuthnHandler.API_KEY)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_API_KEY,
                params: {},
            })
        }

        request.principal = {
            id: `SUPER_USER_${apId()}`,
            type: PrincipalType.SUPER_USER,
            projectId: `SUPER_USER_${apId()}`,
            platform: {
                id: `SUPER_USER_${apId()}`,
            },
        }

        return Promise.resolve()
    }
}
