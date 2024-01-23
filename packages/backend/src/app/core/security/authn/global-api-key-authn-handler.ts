import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { ActivepiecesError, ErrorCode, PrincipalType, apId, isNil } from '@activepieces/shared'

export class GlobalApiKeyAuthnHandler extends BaseSecurityHandler {
    private static readonly HEADER_NAME = 'api-key'
    private static readonly API_KEY = system.get(SystemProp.API_KEY)

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const routeMatches = request.headers[GlobalApiKeyAuthnHandler.HEADER_NAME] !== undefined
        return Promise.resolve(routeMatches)
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
        }

        return Promise.resolve()
    }
}
