import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'

export class GlobalApiKeyAuthnHandler extends BaseSecurityHandler {
    private static readonly API_KEY = system.getOrThrow(SystemProp.API_KEY)

    private static readonly PROTECTED_ROUTES = [
        { method: 'POST', path: '/v1/admin/pieces' },
        { method: 'POST', path: '/v1/admin/flow-templates' },
        { method: 'DELETE', path: '/v1/admin/flow-templates' },
        { method: 'POST', path: '/v1/admin/flow-templates/:id' },
        { method: 'POST', path: '/v1/admin/users' },
        { method: 'POST', path: '/v1/admin/platforms' },
    ]

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const someRouteMatches = GlobalApiKeyAuthnHandler.PROTECTED_ROUTES
            .some(protectedRoute => {
                return protectedRoute.path === request.routerPath &&
                protectedRoute.method === request.method
            })

        return Promise.resolve(someRouteMatches)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const requestApiKey = request.headers['api-key']
        const keyNotMatching = requestApiKey !== GlobalApiKeyAuthnHandler.API_KEY

        if (keyNotMatching) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_API_KEY,
                params: {},
            })
        }

        return Promise.resolve()
    }
}
